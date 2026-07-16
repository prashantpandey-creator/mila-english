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
MAX_CHARS = int(os.environ.get("TTS_MAX_CHARS", "1200"))

voice = PiperVoice.load(MODEL_PATH, CONFIG_PATH)
app = FastAPI()


class SpeakRequest(BaseModel):
    text: str
    # lang is accepted for forward-compat; this voice is English-only. Russian
    # text is handled by the caller's browser-TTS fallback, not here.
    lang: str | None = None


def synth_wav(text: str) -> bytes:
    """Render text to a 16-bit PCM WAV in memory. Piper's synthesize_wav writes
    frames (and the WAV header) into a wave.Wave_write; we hand it a BytesIO so
    nothing touches disk."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        voice.synthesize_wav(text, wav)
    return buf.getvalue()


@app.get("/health")
def health():
    return {"ok": True, "voice": os.path.basename(MODEL_PATH)}


@app.post("/tts")
def tts(req: SpeakRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Missing text")
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]
    try:
        audio = synth_wav(text)
    except Exception as exc:  # noqa: BLE001 — surface a clean 500, caller falls back
        raise HTTPException(status_code=500, detail=f"synthesis failed: {exc}") from exc
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Cache-Control": "no-store"},
    )
