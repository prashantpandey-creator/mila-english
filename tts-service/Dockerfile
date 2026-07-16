FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TTS_MODEL_PATH=/models/amy/en_US-amy-medium.onnx

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Bake the Piper voice into the image (warm US female, ~63MB) by direct download
# from the Hugging Face CDN. Production synthesis therefore makes no outbound
# request. curl (not huggingface_hub) keeps the image lean.
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/* && \
    mkdir -p /models/amy && \
    base="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium" && \
    curl -fsSL "$base/en_US-amy-medium.onnx" -o /models/amy/en_US-amy-medium.onnx && \
    curl -fsSL "$base/en_US-amy-medium.onnx.json" -o /models/amy/en_US-amy-medium.onnx.json && \
    test -s /models/amy/en_US-amy-medium.onnx

COPY server.py ./
EXPOSE 8002
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8002"]
