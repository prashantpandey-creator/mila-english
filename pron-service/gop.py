"""True phoneme-level GOP scoring: espeak G2P → CTC forced alignment → per-phoneme
Goodness of Pronunciation. Proven locally before it becomes the service."""
import os, subprocess, tempfile, numpy as np, onnxruntime as ort, soundfile as sf
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from transformers import AutoProcessor
from phonemizer import phonemize
from phonemizer.separator import Separator

_proc = AutoProcessor.from_pretrained('facebook/wav2vec2-lv-60-espeak-cv-ft')
_tok = _proc.tokenizer
VOCAB = _tok.get_vocab()
BLANK = _tok.pad_token_id
_sess = ort.InferenceSession("onnx_out/model_quantized.onnx", providers=["CPUExecutionProvider"])
_inp = _sess.get_inputs()[0].name


def g2p_words(text):
    """→ [(word_text, [phoneme_id,...]), ...]  (phonemes filtered to vocab)."""
    ph = phonemize(text, language='en-us', backend='espeak',
                   separator=Separator(phone=' ', word=' | '), strip=True, preserve_punctuation=False)
    words_txt = [w for w in text.replace('?', '').replace('.', '').replace(',', '').split()]
    out = []
    for wi, chunk in enumerate([c for c in ph.split('|') if c.strip()]):
        ids = [VOCAB[p] for p in chunk.split() if p in VOCAB]
        wtxt = words_txt[wi] if wi < len(words_txt) else ''
        if ids:
            out.append((wtxt, ids))
    return out


def log_softmax(logits):
    m = logits.max(-1, keepdims=True)
    return logits - (m + np.log(np.exp(logits - m).sum(-1, keepdims=True)))


def forced_align(logp, targets, blank):
    """CTC forced alignment. → frames grouped per target index."""
    ext = [blank]
    for t in targets:
        ext += [t, blank]
    S, T = len(ext), logp.shape[0]
    NEG = -1e30
    dp = np.full((T, S), NEG)
    bp = np.zeros((T, S), dtype=int)
    dp[0, 0] = logp[0, ext[0]]
    if S > 1:
        dp[0, 1] = logp[0, ext[1]]
    for t in range(1, T):
        for s in range(S):
            best, arg = dp[t-1, s], s
            if s > 0 and dp[t-1, s-1] > best:
                best, arg = dp[t-1, s-1], s-1
            if s > 1 and ext[s] != blank and ext[s] != ext[s-2] and dp[t-1, s-2] > best:
                best, arg = dp[t-1, s-2], s-2
            dp[t, s] = best + logp[t, ext[s]]
            bp[t, s] = arg
    s = S-1 if dp[T-1, S-1] >= dp[T-1, S-2] else S-2
    frames = {i: [] for i in range(len(targets))}
    for t in range(T-1, -1, -1):
        if ext[s] != blank:
            frames[(s-1)//2].append(t)
        s = bp[t, s]
    return frames


def score(audio, reference):
    logp = log_softmax(_sess.run(None, {_inp: audio[None, :].astype('float32')})[0][0])
    words = g2p_words(reference)
    flat, owner = [], []
    for wi, (_, ids) in enumerate(words):
        for pid in ids:
            flat.append(pid); owner.append(wi)
    frames = forced_align(logp, flat, BLANK)
    # GOP per phoneme = exp(mean frame log-prob of the expected phoneme)
    accs = []
    for i, pid in enumerate(flat):
        fr = frames.get(i) or []
        accs.append(float(np.exp(np.mean([logp[t, pid] for t in fr]))) if fr else 0.0)
    per_word = []
    for wi, (wtxt, _) in enumerate(words):
        wa = [accs[i] for i in range(len(flat)) if owner[i] == wi]
        per_word.append((wtxt, round(100*np.mean(wa)) if wa else 0))
    overall = round(100*np.mean(accs)) if accs else 0
    return overall, per_word


def load(mp3):
    wav = tempfile.mktemp(suffix=".wav")
    subprocess.run(["ffmpeg", "-y", "-i", os.path.abspath(mp3), "-ar", "16000", "-ac", "1", wav], capture_output=True)
    a, _ = sf.read(wav, dtype='float32')
    return a


if __name__ == "__main__":
    clip = load("../../../../../../../Users/badenath/projects/mila-english/public/audio/us/0.mp3")
    print("clip = native US 'Where is the boarding gate?'\n")
    ov, pw = score(clip, "Where is the boarding gate?")
    print(f"vs CORRECT ref  → overall {ov}   per-word {pw}")
    ov2, pw2 = score(clip, "I have lost my passport")
    print(f"vs WRONG   ref  → overall {ov2}   per-word {pw2}")
