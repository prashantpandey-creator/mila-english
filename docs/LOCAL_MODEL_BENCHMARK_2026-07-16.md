# Mila local voice model benchmark — 2026-07-16

## Decision

Use `gpt-oss:20b` for text Chat and Guide, and keep
`qwen3:4b-instruct-2507-q4_K_M` for Darshan Voice. The 20B open-weight model is
materially more accurate for general questions and fits the 30-GiB production
host, while Qwen 4B remains the only accurate tested option fast enough for spoken turns.
None of the tested sub-2B models was accurate enough to teach English to Russian
speakers, and NVIDIA Nemotron 3 Nano 4B was slower on bilingual turns without
matching Qwen's quality.

The Voice latency fix is operational rather than a model downgrade:

- pin Ollama 0.32.0, which generated the same Qwen 4B answers roughly two to
  three times faster than the previous 0.15.1 runtime in this CPU test;
- load and keep the separate Chat and Voice runtimes resident after ASR and
  pronunciation have booted, with Chat hard-capped at four CPUs and Voice
  receiving higher priority during overlap;
- send only the last two voice turns and cap spoken replies at 50 tokens;
- target one or two sentences and 15–30 spoken words;
- stop recording after 1.2 seconds of silence instead of 1.6 seconds.

Both models use the same Mila persona, learner profile, explicit memories, and
conversation store. No model training or fine-tuning is required.

## Test method

The models ran in an isolated Ollama 0.32.0 container on Mila's production
8-vCPU, 30-GiB server. Each model received the same short bilingual teacher
system prompt, a 4K context, `temperature=0.2`, `think=false`, and a 60-token
maximum. A cold English correction was followed by warm English correction,
Russian explanation, interview role-play, and general-knowledge prompts.

Times below are first visible content / complete response for the correction
prompt. They are model-runtime measurements, not microphone-to-audio totals.

| Model | Cold | Warm | Teaching verdict |
| --- | ---: | ---: | --- |
| Qwen3.5 0.8B | 8.94s / 12.83s | 0.78s / 4.46s | Rejected: missed the grammar error, failed role-play, ignored output rules |
| MiniCPM5 1B Q4 | 3.95s / 14.30s | 0.31s / 0.91s | Rejected: extremely fast warm, but returned incorrect English, Russian, and science explanations |
| LFM2.5 1.2B Q4 | 3.30s / 4.67s | 0.19s / 1.31s | Rejected: incorrectly changed the sentence to “had gone”; Russian output mixed languages |
| Gemma 3 1B | 5.49s / 6.47s | 0.92s / 5.76s | Rejected: said the learner's incorrect tense was correct |
| Qwen3 1.7B Q4 | 7.56s / 11.44s | 0.35s / 3.57s | Rejected as default: closest small candidate, but Russian tense and interview behavior were unreliable |
| Qwen3.5 2B Q4 | 8.95s / 15.10s | 0.62s / 6.25s | Rejected: invented spelling and capitalization errors absent from the prompt |
| Granite 4 H-1B | 4.90s / 5.56s | 0.40s / 1.45s | Rejected: produced “went instead of went” and unusable Russian |
| NVIDIA Nemotron 3 Nano 4B | 9.11s / 11.52s | 0.74s / 6.37s | Rejected: English-only official target; Russian/general warm starts reached 3.76–4.50s |
| Qwen3 4B Instruct, Ollama 0.32.0 | 11.68s / 14.60s | 0.44s / 5.20s | Selected for Voice: best tested bilingual quality at interactive size |

For comparison, the selected Qwen model on the old production Ollama 0.15.1
runtime took 0.86s / 11.36s warm on the same correction and decoded at about
3.1 tokens/second. Ollama 0.32.0 completed the comparable warm answer in 5.20s
and decoded at about 8.2 tokens/second.

The 0.8B model received a second context-engineering trial with a compact
production-style contract, three worked examples, 2K context, low temperature,
and a two-CPU/3-GiB cage. Its first correction took 27.80s cold and produced the
awkward, incomplete “You went there instead of going” rather than the requested
“went, not go” correction. The following Russian probe did not complete within
two minutes, so the run was aborted. Prompt context did not clear the teaching
or operational gate; 0.8B remains unsuitable as Mila's autonomous teacher.

Darshan therefore treats generated speech as a draft, not an authority. The
server collects the short Qwen response, applies a deterministic script guard,
stores only the guarded text, and sends only that controlled script to browser
TTS. This costs token-level streaming but prevents the speaker from reading raw
emoji, markup, or unsupported pronunciation/progress claims.

## Text Chat decision

The first deployed Qwen 4B Chat request took 13.61s / 27.90s and invented a
pronunciation success that had not happened. A Russian general-knowledge request
took 14.40s / 36.57s and incorrectly described blue light as reflected while
red and yellow light were absorbed. Qwen remains suitable for short constrained
Voice replies, but this live result rejected it as Mila's broad Chat model.

The already-cached `gpt-oss:20b` weights were then tested in an isolated Ollama
0.32.0 runtime with a 4K context, low reasoning, and a two-CPU safety cap so the
benchmark could not take over the live server. The cold Russian science answer
was accurate at 86.07s / 160.07s, including a 50.85s model load. Warm English
correction was accurate at 18.79s / 57.99s, and one-question interview role-play
followed the instruction at 37.10s / 57.29s. These capped timings are not the
production target because the Chat container is hard-capped at four CPUs to
protect the site and Voice. They establish capability and memory fit, not Voice
suitability.

`gpt-oss:20b` occupied about 13.2 GiB at 4K and stayed inside a 16-GiB container
limit. With both production Qwen runtimes resident beforehand, the host still
had 18 GiB available; replacing only the Chat Qwen runner keeps the complete
stack inside the 30-GiB host.

An initial production warm-up at 8K with no CPU quota starved HTTPS and SSH on
the 8-vCPU host, so that configuration failed acceptance and was canceled.
Production therefore matches the proven 4K memory profile and hard-caps Chat at
four CPUs. The cap trades some text latency for site and Darshan availability.

## Model notes

- [Qwen3.5 0.8B and 2B](https://huggingface.co/Qwen/Qwen3.5-0.8B) are Apache-2.0
  and broadly multilingual, but their measured teaching quality was not safe at
  these sizes.
- [MiniCPM5-1B](https://huggingface.co/openbmb/MiniCPM5-1B) is the noteworthy
  new exact-1B conversational model. Its official strengths emphasize local
  assistants, tools, code, and reasoning; Mila's test exposed weak language
  teaching accuracy.
- NVIDIA's new `Nemotron-3-Embed-1B` is an embedding/retrieval model, not a chat
  model. It may be useful later for private memory retrieval but cannot answer
  learners.
- [NVIDIA Nemotron 3 Nano 4B](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-4B-GGUF)
  officially targets English local voice assistants. Russian appears in its
  post-training corpus but is not a supported chat language.
- [GPT-OSS 20B](https://developers.openai.com/cookbook/articles/gpt-oss/run-locally-ollama)
  is the slower text-only quality tier. Its low-reasoning mode answered the
  bilingual capability probes correctly, but it is never routed to Darshan
  Voice.

Self-hosting removes the OpenAI/OpenRouter availability dependency from ordinary
Mila chat and voice. It does not by itself guarantee that Mila's web origin is
reachable from every Russian network, and it is not a legal sanctions or export
compliance conclusion.
