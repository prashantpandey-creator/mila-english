# Mila resource-safety change

## Live diagnosis

At 2026-07-23 20:04 UTC, during the MiaChat host-split deployment, the Mumbai
origin reported:

- 30 GiB physical RAM, 20 GiB available, and no swap;
- no kernel OOM-kill entries in the previous six hours;
- Mila web at approximately 113 MiB;
- local speech services at approximately 1.2 GiB combined;
- the compact voice model at approximately 3.2 GiB;
- the dormant GPT-OSS 20B container at approximately 15 MiB before model load;
- load average peaking at 60 while Compose rebuilt all application and speech
  images, then returning to an idle CPU state after the build.

This means the observed release pressure was CPU/build concurrency rather than
an active RAM exhaustion. The dormant 20B runtime remained a real future risk:
one guide request could load roughly 14–16 GiB on top of the compact voice
model and the other PuranGPT services.

## Remediation

- Retire the 20B production container and stop it after every deployment.
- Preserve its Docker volume for rollback; no model data is deleted.
- Point all local companion fallback traffic to the existing 4B Qwen runtime.
- Keep text chat and the learning guide cloud-first.
- Cap Mila web at 1 GiB / 2 CPUs, pronunciation at 1 GiB / 2 CPUs, ASR at
  2 GiB / 3 CPUs, TTS at 1 GiB / 2 CPUs, and compact Ollama at 6 GiB.
- Build the Mila web image on every release, but rebuild speech images only
  when their own source changes or their production containers are absent.

The resulting Mila production envelope is bounded to 11 GiB across all
containers, with normal observed usage near 4–5 GiB.
