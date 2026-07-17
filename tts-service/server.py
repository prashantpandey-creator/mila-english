"""Private CPU text-to-speech service for Mila's chatbot and lesson voice.

A self-hosted Piper neural voice (warm US female, en_US-amy-medium) replaces the
browser's robotic speechSynthesis for spoken answers. Human-sounding, free (own
CPU), works from Russia, and reachable only on the internal Docker network. The
model is baked into the image, so production makes no outbound TTS request.
"""
import io
import os
import wave

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from piper import PiperVoice

MODEL_PATH = os.environ.get("TTS_MODEL_PATH", "/models/amy/en_US-amy-medium.onnx")
CONFIG_PATH = os.environ.get("TTS_CONFIG_PATH", MODEL_PATH + ".json")
# Russian neural voice (irina, female — matches Mila) alongside English. Both
# self-hosted, so a Russian learner gets a real voice with no outbound request
# and no VPN — the browser-TTS fallback is no longer the Russian path.
RU_MODEL_PATH = os.environ.get("TTS_RU_MODEL_PATH", "/models/irina/ru_RU-irina-medium.onnx")
RU_CONFIG_PATH = os.environ.get("TTS_RU_CONFIG_PATH", RU_MODEL_PATH + ".json")
MAX_CHARS = int(os.environ.get("TTS_MAX_CHARS", "1200"))

voice = PiperVoice.load(MODEL_PATH, CONFIG_PATH)

# The Russian voice is best-effort: if its model is missing the service still
# serves English (Russian then falls back to the browser, as before).
ru_voice = None
try:
    ru_voice = PiperVoice.load(RU_MODEL_PATH, RU_CONFIG_PATH)
except Exception:  # noqa: BLE001 — degrade to English-only, never fail to boot
    ru_voice = None

app = FastAPI()


class SpeakRequest(BaseModel):
    text: str
    # 'ru'/'ru-RU' picks the Russian voice; anything else uses English.
    lang: str | None = None


def pick_voice(lang: str | None) -> PiperVoice:
    if ru_voice is not None and (lang or "").lower().startswith("ru"):
        return ru_voice
    return voice


def synth_wav(text: str, selected: PiperVoice) -> bytes:
    """Render text to a 16-bit PCM WAV in memory. Piper's synthesize_wav writes
    frames (and the WAV header) into a wave.Wave_write; we hand it a BytesIO so
    nothing touches disk."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        selected.synthesize_wav(text, wav)
    return buf.getvalue()


@app.get("/health")
def health():
    return {
        "ok": True,
        "voice": os.path.basename(MODEL_PATH),
        "ru_voice": os.path.basename(RU_MODEL_PATH) if ru_voice is not None else None,
    }


@app.post("/tts")
def tts(req: SpeakRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Missing text")
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]
    try:
        audio = synth_wav(text, pick_voice(req.lang))
    except Exception as exc:  # noqa: BLE001 — surface a clean 500, caller falls back
        raise HTTPException(status_code=500, detail=f"synthesis failed: {exc}") from exc
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Cache-Control": "no-store"},
    )
