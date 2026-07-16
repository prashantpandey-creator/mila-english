# Russia-resilient learner path

## Decision

Mila's default level check is a self-hosted voice assessment. It does not relay
Russian learner traffic to OpenAI or OpenRouter:

1. The learner records through Mila's same-origin web app.
2. `pron-service` scores one fixed read-aloud phrase with the resident ONNX
   phoneme model.
3. `asr-service` transcribes four spontaneous English answers with a
   faster-whisper model baked into the container.
4. Mila derives CEFR placement from answer length, task completion, linking
   language, vocabulary range, and evidence of past, hypothetical, and opinion
   structures. Pronunciation contributes 15% to the numeric score but cannot
   raise the CEFR level.
5. Temporary audio files are deleted immediately after inference. The services
   are reachable only on the private Docker network.
6. Mila saves the result and creates a bundled starter plan without an external
   AI call.

The 15-question no-microphone test remains a provider-free fallback. OpenAI
Realtime is an optional enhancement only for learners in supported countries.

## Self-hosted chat and conversational voice

Mila's core companion uses one private chat path across typed Chat, the floating
guide, and Darshan:

1. The already-trained Qwen model runs inside the private Ollama container.
2. Mila supplies the same persona, learner profile, recent progress,
   conversation history, explicit memories, and current lesson context to every
   surface.
3. Darshan records one utterance, sends it to the private multilingual
   faster-whisper service, sends the transcript through the same chat endpoint,
   and reads the answer aloud.
4. Assessment requests force English transcription; Darshan uses language
   auto-detection so an English learner can also ask a general question in
   Russian.
5. External chat fallback is disabled by default. No OpenAI or OpenRouter key is
   required for the companion, lessons, local assessment, or local Darshan.

This makes voice an input/output layer around the chat brain instead of a
separate Mila. Browser speech synthesis is still the least controlled part of
the local Darshan path: Mila prefers installed voices, but final offline voice
acceptance must confirm that the target browser has a suitable local English or
Russian voice.

## Why OpenAI and OpenRouter are not the Russia route

OpenAI says API access outside its listed supported countries may lead to an
account being blocked or suspended, and Russia is not in the current list:

- https://developers.openai.com/api/docs/supported-countries

OpenRouter prohibits using proxies or VPNs to reach a model where that model's
provider restricts the user's region:

- https://openrouter.ai/terms

Therefore:

- Never route a Russian learner through Mumbai to disguise their location.
- Never treat an OpenRouter key as permission to bypass an underlying model
  provider's territorial terms.
- Keep the local assessment and lessons working with all external AI keys
  absent, invalid, rate-limited, or unavailable.

## Russian-provider option reviewed

Sber's SaluteSpeech supports synchronous speech recognition and synthesis,
including English recognition (`en-US`) and English synthesis. Its individual
quick start supports API-key credentials. Commercial use requires a paid
package; the freemium package is personal and non-commercial:

- https://developers.sber.ru/docs/ru/salutespeech/overview
- https://developers.sber.ru/docs/ru/salutespeech/rest/sync-general
- https://developers.sber.ru/docs/ru/salutespeech/api/grpc/recognition-stream
- https://developers.sber.ru/docs/ru/salutespeech/guides/synthesis/ssml/language
- https://developers.sber.ru/docs/ru/salutespeech/quick-start/integration-individuals
- https://developers.sber.ru/docs/ru/salutespeech/tariffs/commercial

GigaChat is also a Russian service with API credentials and a commercial paid
package. Its individual agreement is written for Russian Federation residents:

- https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/gigachat-api
- https://developers.sber.ru/docs/ru/gigachat-agreement/individuals
- https://developers.sber.ru/docs/ru/gigachat/tariffs/commercial

These are legitimate future managed-service options, not the default. Mila uses
the in-house route so the core assessment does not depend on a third party's
availability, commercial approval, or changing territorial policy.

## Open-source basis

Whisper's code and model weights are MIT licensed. faster-whisper is also MIT
licensed, supports CPU `int8`, and can load an already-downloaded model with
`local_files_only`, which is how the production image runs offline:

- https://github.com/openai/whisper
- https://github.com/SYSTRAN/faster-whisper
- https://github.com/SYSTRAN/faster-whisper/blob/master/LICENSE

## Acceptance test

Do not call the Russia voice path verified until Mary tests it from a Russian
mobile network without a VPN:

- Sign in or continue as guest.
- Open **Проверка уровня** and choose the default voice check.
- Complete the pronunciation phrase and all four spontaneous answers.
- Confirm each transcript is visible and can be retried.
- Confirm the dashboard shows the saved CEFR level and starter lessons open.
- Repeat on a weak connection and verify a failed recording can be retried
  without losing completed answers.
- Confirm server logs show no OpenAI, OpenRouter, or Hugging Face request during
  the local assessment.
- Open **Darshan**, ask one English teaching question and one general question,
  and confirm both answers appear in the same history on **Chat**.
- Repeat the general question in Russian and confirm multilingual transcription
  and Russian speech output work without a VPN.
- Confirm Darshan's request logs show the private ASR and Ollama services, not
  OpenAI Realtime.

Only that test turns “designed for Russia” into “verified in Russia.”
