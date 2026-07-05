# mila-pron — phoneme scoring service

Resident onnxruntime service that scores pronunciation with true per-phoneme GOP,
from an int8 `facebook/wav2vec2-lv-60-espeak-cv-ft` model. Deployed on the Hetzner
box (container `mila-pron`, coolify network); mila reaches it at `http://mila-pron:8000`
via `src/app/api/pronounce/route.ts`.

## The model (not in git — 341 MB)
Regenerate `model.onnx` (int8) from `export2.py` + MatMul-only `quantize_dynamic`
(see git history / the w2v2 spike). Then `scp model.onnx` next to `server.py`.

## Pipeline
espeak G2P (reference → phonemes, all in the model's 392-phoneme vocab) → CTC
forced alignment of frame log-probs to expected phonemes → GOP per phoneme
(exp of mean expected-phoneme log-prob) → per-word + overall. `gop.py` is the
proven reference; `server.py` is the FastAPI wrapper (no torch — vocab.json only).

## Deploy
`docker compose build && docker compose up -d`  ·  measured ~394 ms/clip on the box.
