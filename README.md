# Mila

> Mila — personalized English learning platform for beginners, children, adults, and intermediate learners — built on real learner research

## Getting Started

```bash
npm install
npx prisma db push
npm run dev
```

The primary voice assessment is self-hosted. One read-aloud phrase is scored by
`pron-service`, and four spontaneous answers are transcribed by the offline
faster-whisper model in `asr-service`. The browser only contacts the Mila
origin; recordings are processed on Mila's private Docker network and deleted
after each request. CEFR placement is derived from spontaneous language
evidence, with pronunciation used only as a small supporting signal. This is
the intended Russia path and still requires an acceptance test from a Russian
mobile network without a VPN before it is called verified.

The no-microphone assessment and bundled starter lessons are also provider-free.
OpenAI Realtime remains an optional live-interview enhancement for supported
regions. Copy `.env.local.example` to `.env.local` and set `OPENAI_API_KEY` only
when that optional path is needed; the standard key is never exposed to the
browser.

For eligible regions, custom lesson generation uses OpenAI first and can fall
back to OpenRouter when both `OPENROUTER_API_KEY` and an explicitly reviewed
`OPENROUTER_ASSESSMENT_MODEL` are configured. OpenRouter cannot replace the
direct OpenAI Realtime connection used by the optional live AI interview. Do not use a
proxy to bypass a provider's country restrictions; confirm the selected model's
terms for the learner's region.

For the self-hosted stack, `docker compose -f docker-compose.prod.yml build`
bakes the multilingual faster-whisper `small` ASR model into the image. Assessment
requests force English, while Darshan can auto-detect English or Russian. Runtime
transcription makes no request to OpenAI, Hugging Face, or OpenRouter. The pronunciation ONNX file is
intentionally not committed; place `pron-service/model.onnx` as described in
[`pron-service/README.md`](pron-service/README.md) before building production.

## Companion model routing

Mumbai production uses configured cloud text models for Chat, the floating
guide, and controlled Voice drafts. The older resident GPT-OSS 20B and Qwen3 4B
Ollama pair was retired from the shared host after its deploy warm-ups competed
for constrained container memory. Speech stays self-hosted: ASR,
pronunciation, and Piper TTS still run on Mila's private Docker network.

The same companion endpoint, learner context, explicit memories, persona, and
conversation store power Chat, the guide, and Darshan, while cloud model routing
remains surface-specific. Darshan adds local speech recognition before its text
request and local Piper or browser speech output afterward. A deterministic
controller validates the Voice script and removes
unsupported hearing/progress claims, praise without evidence, emoji, and markup;
the speaker never receives unchecked model text. OpenAI Realtime remains a
supported-region live-audio path and uses the server-side key only.

For native development, install Ollama and run:

```bash
ollama pull gpt-oss:20b
ollama pull qwen3:4b-instruct-2507-q4_K_M
ollama serve
```

Then copy `.env.local.example` to `.env.local`. Its
`LOCAL_LLM_ENABLED=true` and `LOCAL_LLM_URL=http://127.0.0.1:11434` values are
correct when Next.js and Ollama both run natively on the same development host.
The Compose files no longer declare Ollama services; opt in there only when the
configured `LOCAL_*_URL` values reach independently managed runtimes.

The measured local-model comparison, live timings, and rejection reasons are
recorded in
[`docs/LOCAL_MODEL_BENCHMARK_2026-07-16.md`](docs/LOCAL_MODEL_BENCHMARK_2026-07-16.md).

Mila injects `reasoning_effort=low` for GPT-OSS so it does not exhaust a short
conversational response budget on hidden reasoning. A smaller machine can set
`LOCAL_LLM_MODEL=qwen3:4b-instruct-2507-q4_K_M` to share the Voice checkpoint,
or use `qwen3:1.7b-q4_K_M` when even 4B does not fit; both fallbacks reduce
quality. Never point Darshan at GPT-OSS on a CPU-only host.

The production deployment starts the app and local speech services, then
hard-gates the exact cloud Chat and controlled-Voice targets with
`scripts/check-cloud-brains.mjs`. Those two checks run sequentially. Production
also forces `LOCAL_LLM_ENABLED=false`, so an old server `.env` cannot add failed
Ollama health probes or model loads back into normal turns. OpenRouter is chosen
for a surface only when its key and matching model configuration are present;
otherwise OpenAI is used when configured. Never use either provider to bypass
regional terms. Russian-network availability of the Mila web origin must still
be acceptance-tested from Russia without a VPN.

## Telegram translator

The Russian↔English Telegram translator lives at `/api/telegram/webhook` and is
operationally separate from the PuranGPT announcement bot. See
[`docs/TELEGRAM_TRANSLATOR.md`](docs/TELEGRAM_TRANSLATOR.md) for BotFather,
environment, webhook, privacy, and quality-benchmark setup.

## Architecture

- **Stack:** nextjs
- **Entities:** User, Lesson, Exercise, Progress, Word, Achievement, Assessment, StudySession, PhonemeStat
- **Routes:** 29 API endpoints
- **Pages:** 15 pages
- **Components:** 44 components
- **Auth:** jwt

### Data Model
- **User** — Learner with category-based personalization
  - id: integer (required)
  - email: email (required)
  - name: string (required)
  - learnerCategory: string (required)
  - nativeLanguage: string (required)
  - level: string
  - joinDate: datetime (required)
- **Lesson** — Personalized lesson for specific learner category and skill
  - id: integer (required)
  - title: string (required)
  - category: string (required)
  - learnerLevel: string (required)
  - durationMinutes: integer (required)
  - content: text (required)
  - visualAidUrl: url
  - audioUrl: url
  - difficulty: integer (required)
- **Exercise** — Interactive exercise within a lesson
  - id: integer (required)
  - lessonId: integer (required)
  - type: string (required)
  - question: text (required)
  - correctAnswer: string (required)
  - options: json
  - points: integer (required)
  - hintText: string
- **Progress** — Per-user progress tracking per lesson
  - id: integer (required)
  - userId: integer (required)
  - lessonId: integer (required)
  - completed: boolean (required)
  - score: integer
  - timeSpentSeconds: integer
  - mistakes: json
  - lastAttemptDate: datetime
- **Word** — Vocabulary with spaced repetition (SRS) for retention
  - id: integer (required)
  - english: string (required)
  - phonetic: string (required)
  - translationNative: string (required)
  - partOfSpeech: string (required)
  - exampleSentence: text
  - audioUrl: url
  - difficultyLevel: integer (required)
  - learnerCategory: string (required)
  - nextReviewDate: datetime
  - repetitionCount: integer
- **Achievement** — Gamification badges and achievements
  - id: integer (required)
  - userId: integer (required)
  - badgeName: string (required)
  - badgeIcon: string (required)
  - description: string (required)
  - earnedDate: datetime (required)
  - category: string (required)
- **Assessment** — Placement tests and progress assessments
  - id: integer (required)
  - userId: integer (required)
  - type: string (required)
  - score: integer (required)
  - maxScore: integer (required)
  - recommendedLevel: string
  - weakAreas: json
  - takenDate: datetime (required)
- **StudySession** — Study session tracking with streak counting
  - id: integer (required)
  - userId: integer (required)
  - startTime: datetime (required)
  - endTime: datetime
  - lessonsCompleted: integer
  - wordsReviewed: integer
  - focusArea: string
  - streakDay: integer

### API Routes
- `POST /api/auth/register` — Register new learner
- `POST /api/auth/login` — Login
- `GET /api/users/me` 🔒 — Get current user
- `GET /api/lessons` 🔒 — Get personalized lessons
- `GET /api/lessons/:id` 🔒 — Get lesson with exercises
- `POST /api/exercises/:id/check` 🔒 — Submit exercise answer
- `GET /api/progress` 🔒 — Get progress dashboard
- `GET /api/words` 🔒 — Get words for review (SRS)
- `POST /api/words/:id/review` 🔒 — Record word review
- `GET /api/achievements` 🔒 — Get achievements
- `POST /api/assessments` 🔒 — Submit assessment
- `GET /api/assessments` 🔒 — Get assessment history
- `POST /api/sessions` 🔒 — Start study session
- `GET /api/sessions/current` 🔒 — Get current session
- `PUT /api/sessions/current` 🔒 — End study session
- `GET /api/phonetics/:word` 🔒 — Get phonetics guide
