"""Resident phoneme-scoring service. Loads the int8 wav2vec2-espeak model once and
serves true GOP scores. onnxruntime + numpy + phonemizer only — no torch."""
import json, os, subprocess, tempfile, numpy as np, onnxruntime as ort, soundfile as sf
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from phonemizer import phonemize
from phonemizer.separator import Separator

HERE = os.path.dirname(os.path.abspath(__file__))
_d = json.load(open(os.path.join(HERE, "vocab.json"), encoding="utf-8"))
VOCAB, BLANK = _d["vocab"], _d["blank"]
IVOCAB = {v: k for k, v in VOCAB.items()}  # id -> phoneme, for substitution decode
_sess = ort.InferenceSession(os.path.join(HERE, "model.onnx"), providers=["CPUExecutionProvider"])
_INP = _sess.get_inputs()[0].name

GOOD, CLOSE = 68, 40
def verdict(a): return "good" if a >= GOOD else "close" if a >= CLOSE else "miss"


def g2p_words(text):
    ph = phonemize(text, language="en-us", backend="espeak",
                   separator=Separator(phone=" ", word=" | "), strip=True, preserve_punctuation=False)
    wtxt = [w for w in text.replace("?", "").replace(".", "").replace(",", "").split()]
    out = []
    for wi, chunk in enumerate([c for c in ph.split("|") if c.strip()]):
        phs = [p for p in chunk.split() if p in VOCAB]
        if phs:
            out.append((wtxt[wi] if wi < len(wtxt) else "", phs))
    return out


def log_softmax(x):
    m = x.max(-1, keepdims=True)
    return x - (m + np.log(np.exp(x - m).sum(-1, keepdims=True)))


def forced_align(logp, targets, blank):
    ext = [blank]
    for t in targets:
        ext += [t, blank]
    S, T = len(ext), logp.shape[0]
    dp = np.full((T, S), -1e30); bp = np.zeros((T, S), dtype=int)
    dp[0, 0] = logp[0, ext[0]]
    if S > 1: dp[0, 1] = logp[0, ext[1]]
    for t in range(1, T):
        for s in range(S):
            best, arg = dp[t-1, s], s
            if s > 0 and dp[t-1, s-1] > best: best, arg = dp[t-1, s-1], s-1
            if s > 1 and ext[s] != blank and ext[s] != ext[s-2] and dp[t-1, s-2] > best: best, arg = dp[t-1, s-2], s-2
            dp[t, s] = best + logp[t, ext[s]]; bp[t, s] = arg
    s = S-1 if dp[T-1, S-1] >= dp[T-1, S-2] else S-2
    frames = {i: [] for i in range(len(targets))}
    for t in range(T-1, -1, -1):
        if ext[s] != blank: frames[(s-1)//2].append(t)
        s = bp[t, s]
    return frames


def heard_phoneme(logp, fr, expected_pid):
    """What the model actually heard in this phoneme's frame window: argmax over
    summed frame log-probs (blank excluded). Zero extra inference — reuses logp."""
    if not fr:
        return None
    mass = logp[fr].sum(0)
    mass[BLANK] = -1e30
    heard = int(mass.argmax())
    return IVOCAB.get(heard) if heard != expected_pid else None


def score(audio, reference):
    logp = log_softmax(_sess.run(None, {_INP: audio[None, :].astype("float32")})[0][0])
    words = g2p_words(reference)
    flat, owner = [], []
    for wi, (_, phs) in enumerate(words):
        for p in phs:
            flat.append(VOCAB[p]); owner.append((wi, p))
    frames = forced_align(logp, flat, BLANK)
    accs, subs = [], []
    for i, pid in enumerate(flat):
        fr = frames.get(i) or []
        accs.append(int(round(100 * float(np.exp(np.mean([logp[t, pid] for t in fr]))))) if fr else 0)
        # substitution only meaningful when the phoneme was off (below GOOD)
        subs.append(heard_phoneme(logp, fr, pid) if accs[-1] < GOOD else None)
    out_words = []
    for wi, (wtxt, _) in enumerate(words):
        idxs = [i for i in range(len(flat)) if owner[i][0] == wi]
        wa = int(round(np.mean([accs[i] for i in idxs]))) if idxs else 0
        phonemes = []
        for i in idxs:
            entry = {"ph": owner[i][1], "acc": accs[i], "verdict": verdict(accs[i])}
            if subs[i]:
                entry["sub"] = subs[i]  # what they said instead
            phonemes.append(entry)
        out_words.append({"word": wtxt, "score": wa, "verdict": verdict(wa), "phonemes": phonemes})
    overall = int(round(np.mean(accs))) if accs else 0
    worst = min(out_words, key=lambda w: w["score"]) if out_words else None
    tip, tip_ru = build_tips(worst)
    return {"score": overall, "words": out_words, "tip": tip, "tip_ru": tip_ru}


def build_tips(worst):
    """One encouraging suggestion, in both languages. `tip` stays English for
    backward compatibility; `tip_ru` is additive — the RU UI can prefer it."""
    if worst and worst["score"] < GOOD:
        w = worst["word"]
        return (f"Polish “{w}” — say it once more.",
                f"Отшлифуй «{w}» — скажи ещё раз.")
    return ("Clean run. Next one.",
            "Отлично получилось. Следующая!")


def decode(raw: bytes) -> np.ndarray:
    src = tempfile.mktemp(); dst = tempfile.mktemp(suffix=".wav")
    open(src, "wb").write(raw)
    subprocess.run(["ffmpeg", "-y", "-i", src, "-ar", "16000", "-ac", "1", dst], capture_output=True)
    a, _ = sf.read(dst, dtype="float32")
    for f in (src, dst):
        try: os.remove(f)
        except OSError: pass
    if a.ndim > 1: a = a.mean(1)
    return a


app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"ok": True, "vocab": len(VOCAB)}


@app.post("/pronounce")
async def pronounce(audio: UploadFile = File(...), reference: str = Form(...)):
    a = decode(await audio.read())
    if a is None or len(a) < 1600:
        # Technical no-capture, NOT a pronunciation judgment — both languages.
        return {"score": 0, "words": [],
                "tip": "Didn't catch that — say it again.",
                "tip_ru": "Не расслышала — скажи ещё раз."}
    return score(a, reference)
