# Mila

> Mila — personalized English learning platform for beginners, children, adults, and intermediate learners — built on real learner research

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npx prisma db push
npm run dev
```

Set a unique `JWT_SECRET` before creating accounts. `APP_URL` may use
`http://localhost:3000` locally, but production billing, email-verification, and
password-recovery links must use the public HTTPS origin.

## Accounts and paid access

Mila has two honest access levels:

- **Free** includes the level check, starter plan and lessons, vocabulary and
  grammar practice, Chat, learning progress, and one consented Live voice
  preview from the front door.
- **Mila Pro — 30 days** costs **1 490 ₽** as a one-time pass. It adds custom
  lessons and the optional fast live-voice path. It does **not** renew
  automatically. A learner must convert a guest profile into an account before
  buying so access and progress are not tied to one browser or device.

The web app uses YooKassa's hosted redirect checkout. Mila creates an immutable
local order, sends the learner to YooKassa, and grants access only after it
fetches the payment from YooKassa and verifies the payment ID, amount, currency,
product, and order metadata. Callback payloads and browser return parameters are
never treated as proof of payment, and Mila never receives card details.

Paid checkout is deliberately fail-closed. If either YooKassa credential is
missing, `/pricing` still shows Free and Pro accurately but the purchase button
says that checkout is opening soon and cannot create an order. Free learning
continues to work.

## Anonymous visitor counts

The web app records privacy-preserving, first-party page counts for Mila, Gia,
and Mia. It stores the site and path without query strings against a one-way
hash of a random same-site cookie. It does not store IP addresses, user agents,
referrers, or device fingerprints, and it honors Do Not Track and Global
Privacy Control signals.

To see unique visitors, page views, daily totals, and the top 20 pages for the
last 30 days:

```bash
npm run analytics:report -- 30
```

The optional day range must be between 1 and 366.

### Production setup

1. Complete YooKassa merchant onboarding and use the shop's own test credentials
   for an end-to-end test before switching to live credentials.
2. Put these values in the server-side `.env` (never in browser code or Git):

   ```dotenv
   APP_URL=https://mila.purangpt.com
   YOOKASSA_SHOP_ID=...
   YOOKASSA_SECRET_KEY=...
   # Optional; set only to the VAT code required by the merchant configuration.
   YOOKASSA_VAT_CODE=...
   ```

3. In YooKassa, register the HTTPS webhook URL
   `https://mila.purangpt.com/api/billing/webhooks/yookassa` for
   `payment.succeeded`, `payment.canceled`, and `refund.succeeded` events.
4. Configure account-verification and password-recovery delivery with a
   verified Resend sender:

   ```dotenv
   RESEND_API_KEY=re_...
   AUTH_EMAIL_FROM=Mila <support@your-verified-domain.example>
   ```

5. Production forces `VOICE_REALTIME_PAID_ONLY=true`, and the server independently
   enforces the same invariant even if an old environment file says otherwise.
   The self-hosted Mila voice path is the private default; an eligible Pro learner
   must explicitly choose the external live-voice path before audio is sent to
   that provider.
6. Test the complete path with a new registered account: hosted checkout,
   provider return, webhook delivery, Pro expiry date in Account, a repeated
   callback, cancellation, and a full refund. A full refund revokes the pass
   unless another paid pass is still active.

The iOS build remains purchase-free for this launch. Paid access is bought on
the web and follows the same Mila account; do not add an in-app web purchase
link or claim iOS in-app purchasing until a StoreKit flow has been reviewed and
implemented.

### Production database safety

The deploy workflow takes a consistent SQLite snapshot before the replacement
image can run `prisma db push`. For a running production container it writes
`/data/backups/mila-<UTC timestamp>.db` inside the `mila_data` volume, runs
`PRAGMA quick_check` against that snapshot, and aborts without replacing the
current service if either step fails. A true first deploy has no running
container and therefore no existing database to snapshot.

After the new snapshot passes `quick_check`, the workflow keeps at most 14
on-volume backups. It always preserves the snapshot verified for the current
deploy, then retains the newest timestamped snapshots. Pruning considers only
regular files whose names exactly match `mila-YYYYMMDDTHHMMSSZ.db` inside
`/data/backups`, validates every target, and unlinks files individually. An
unexpected path, filename, link, missing current snapshot, or deletion failure
aborts before the running service is replaced; no recursive or broad deletion
is used.

These snapshots protect the additive schema-sync step, but a copy in the same
Docker volume does not protect against host or volume loss. Operations should
copy verified snapshots to encrypted off-host storage and apply a documented
retention policy there. The 14-snapshot on-volume limit is only a bounded deploy
rollback window and is not a substitute for independently retained off-host
backups.

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

## Self-hosted companion model

Mila keeps one compact, already-trained multilingual
[Qwen3](https://github.com/QwenLM/Qwen3) 4B instruction model in a private
Ollama runtime; no fine-tuning or training job is required. It powers local
voice and provides a bounded fallback for text. Its weights are downloaded once
into a Docker volume and kept out of Git and application images.

The same companion endpoint, learner context, explicit memories, persona, and
conversation store power Chat, the guide, and local voice. Production text chat
and the floating guide are cloud-first; if that provider is unavailable they
fall back to the same bounded 4B runtime. Local voice uses a compact spoken
prompt and never wakes a larger model. It adds local speech recognition before
the chat request and browser speech output afterward. A deterministic
controller validates the complete Voice script and removes unsupported
hearing/progress claims, praise without evidence, emoji, and markup; the speaker
never receives raw model tokens. OpenAI Realtime remains an optional
supported-region enhancement.

For native development, install Ollama and run:

```bash
ollama pull qwen3:4b-instruct-2507-q4_K_M
ollama serve
```

Then copy `.env.local.example` to `.env.local`; its
`LOCAL_LLM_URL=http://127.0.0.1:11434` value is correct when Next.js and Ollama
both run on the host. For the Docker stack, Ollama is available only to Mila on
the private Docker network and is intentionally not published on a host port:

```bash
docker compose -f docker-compose.prod.yml up -d mila-voice-llm
docker exec -e OLLAMA_HOST=127.0.0.1:11434 mila-voice-llm \
  ollama pull qwen3:4b-instruct-2507-q4_K_M
docker compose -f docker-compose.prod.yml up -d
```

Production uses `qwen3:4b-instruct-2507-q4_K_M` for latency, multilingual
quality, and predictable co-tenancy. The runtime has a 6 GB memory ceiling,
`OLLAMA_CONTEXT_LENGTH=4096`, `OLLAMA_NUM_PARALLEL=1`, and keeps one model
loaded. The web, pronunciation, ASR, and TTS containers also have explicit
memory and CPU ceilings. Production pins Ollama 0.32.0 and warms the compact
runtime after ASR and pronunciation are healthy. The former GPT-OSS 20B
container is stopped and its volume retained only for rollback; this removes a
possible 14–16 GB request-time memory surge. The measured model comparison,
live timings, and rejection reasons are recorded in
[`docs/LOCAL_MODEL_BENCHMARK_2026-07-16.md`](docs/LOCAL_MODEL_BENCHMARK_2026-07-16.md).

The production deployment builds the web image every release but reuses speech
images unless their own source changed. It pulls the configured compact model,
starts Mila and the speech services, then verifies both the local runtime and
the cloud text provider. The initial model download still requires outbound
access to Ollama's registry. Russian-network availability of the Mila web
origin must still be acceptance-tested from Russia without a VPN.

Production keeps `ALLOW_EXTERNAL_CHAT_FALLBACK=true`; the text cascade prefers
OpenRouter when its key and an explicitly reviewed `OPENROUTER_CHAT_MODEL` are
present, then OpenAI when its key is present, and finally the compact local
model. Never use a provider to bypass its regional terms.

## Telegram translator

The Russian↔English Telegram translator lives at `/api/telegram/webhook` and is
operationally separate from the PuranGPT announcement bot. See
[`docs/TELEGRAM_TRANSLATOR.md`](docs/TELEGRAM_TRANSLATOR.md) for BotFather,
environment, webhook, privacy, and quality-benchmark setup.

## Architecture

- **Stack:** nextjs
- **Entities:** User, AccountToken, Payment, PaymentEvent, Lesson, Exercise, Progress, Word, Achievement, Assessment, StudySession, PhonemeStat
- **Routes:** Next.js API routes for accounts, learning, speech, billing, and support services
- **Pages:** Public acquisition and legal pages plus authenticated learning, account, and billing flows
- **Components:** 44 components
- **Auth:** signed JWT sessions with database-backed revocation

### Data Model
- **User** — Learner with category-based personalization
  - id: integer (required)
  - email: email (required)
  - name: string (required)
  - learnerCategory: string (required)
  - nativeLanguage: string (required)
  - level: string
  - joinDate: datetime (required)
- **AccountToken** — Hashed, expiring, single-use email-verification or password-recovery token
- **Payment** — Durable hosted-checkout order and verified Pro access period
- **PaymentEvent** — Idempotent provider callback-processing record
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
- `POST /api/auth/send-verification` 🔒 — Send a single-use email-verification link
- `POST /api/auth/verify-email` — Verify control of a registered email
- `POST /api/auth/forgot-password` — Send a single-use password-reset link
- `POST /api/auth/reset-password` — Reset a password and revoke older sessions
- `GET /api/users/me` 🔒 — Get current user
- `DELETE /api/users/me` 🔒 — Delete an account and learning data
- `GET /api/billing/catalog` — Get the public Free/Pro offer and availability
- `POST /api/billing/checkout` 🔒 — Create a hosted YooKassa checkout
- `GET /api/billing/status` 🔒 — Reconcile an order and get entitlement
- `POST /api/billing/webhooks/yookassa` — Reconcile a YooKassa callback
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
