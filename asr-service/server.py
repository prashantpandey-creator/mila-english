"""Private CPU speech-to-text service for Mila's voice and assessment flows.

The model is baked into the container and the service is reachable only on the
internal Docker network. No audio is retained after the request completes.
"""
import asyncio
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from faster_whisper import WhisperModel

MODEL_PATH = os.environ.get("ASR_MODEL_PATH", "/models/small")
COMPUTE_TYPE = os.environ.get("ASR_COMPUTE_TYPE", "int8")
CPU_THREADS = int(os.environ.get("ASR_CPU_THREADS", "4"))
MAX_AUDIO_BYTES = 8 * 1024 * 1024

model = WhisperModel(
    MODEL_PATH,
    device="cpu",
    compute_type=COMPUTE_TYPE,
    cpu_threads=CPU_THREADS,
    local_files_only=True,
)
inference_slot = asyncio.Semaphore(1)
app = FastAPI()


def transcribe_file(path: str, language: str):
    segments, info = model.transcribe(
        path,
        language=None if language == "auto" else language,
        task="transcribe",
        beam_size=2,
        temperature=0,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
        condition_on_previous_text=False,
    )
    completed = list(segments)
    text = " ".join(segment.text.strip() for segment in completed if segment.text.strip()).strip()
    duration = max((segment.end for segment in completed), default=0.0)
    avg_logprob = (
        sum(segment.avg_logprob for segment in completed) / len(completed)
        if completed else None
    )
    no_speech_probability = max(
        (segment.no_speech_prob for segment in completed),
        default=1.0,
    )
    return {
        "text": text,
        "durationSeconds": round(float(duration), 2),
        "avgLogprob": round(float(avg_logprob), 4) if avg_logprob is not None else None,
        "noSpeechProbability": round(float(no_speech_probability), 4),
        "language": info.language,
    }


@app.get("/health")
def health():
    return {"ok": True, "model": Path(MODEL_PATH).name, "computeType": COMPUTE_TYPE}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form("en")):
    if language not in {"en", "ru", "auto"}:
        raise HTTPException(status_code=400, detail="unsupported language")
    raw = await audio.read(MAX_AUDIO_BYTES + 1)
    if not raw:
        raise HTTPException(status_code=400, detail="empty audio")
    if len(raw) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="audio exceeds 8 MB")

    suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
            temp.write(raw)
            temp_path = temp.name
        async with inference_slot:
            result = await run_in_threadpool(transcribe_file, temp_path, language)
        if not result["text"]:
            raise HTTPException(status_code=422, detail="no speech recognized")
        return result
    finally:
        if temp_path:
            try:
                os.remove(temp_path)
            except OSError:
                pass
