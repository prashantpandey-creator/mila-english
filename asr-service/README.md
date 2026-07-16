# mila-asr

Private multilingual speech-to-text service for Mila's self-hosted voice flows.
It runs faster-whisper `small` on CPU with `int8` inference and four inference
threads by default. Assessment requests
force English; Darshan requests automatic English/Russian language detection.

## Network and data boundary

- The service has no published host port in production.
- Only the Mila app container calls it over the private Docker network.
- The model is downloaded while the image is built and loaded with
  `local_files_only=True` at runtime.
- Each upload is limited to 8 MB, written to a temporary file for inference,
  and deleted in a `finally` block.
- Inference is serialized to prevent concurrent requests exhausting a small
  production CPU host.

## Build and health check

```bash
docker build -t mila-asr ./asr-service
docker run --rm -p 127.0.0.1:8001:8001 mila-asr
curl http://127.0.0.1:8001/health
```

The production deploy builds this service through `docker-compose.prod.yml`
and checks both its internal health endpoint and reachability from the Mila app
container before the deploy succeeds.
