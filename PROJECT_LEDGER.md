# Mila — Project Ledger (live state, shared across all agents)

**Read this first. Update it after every deploy.** This file is the single
source of truth for what is ACTUALLY live vs. local vs. owed. It exists because
work drifted: designs got called "LIVE" while sitting unpushed in local
worktrees. The owner cannot see worktrees — only `mila.purangpt.com` is real.

**The only definition of "done/live": `git push origin main` → green CI deploy
→ a change visible at https://mila.purangpt.com and confirmed by (a) grepping
the live CSS/JS bundle for the new values AND (b) a screenshot of the live URL.
No local screenshot counts. No "LIVE" claim without both.**

---

## LIVE NOW (verified on prod)

| Area | State | Commit | Proof |
|------|-------|--------|-------|
| Global coming-of-age Mila | **Current product direction.** Mila now leads with language, confidence, curiosity, and growing into your voice rather than an English-only promise. The front door says “Find your voice, in any language,” sends conversation learners into multilingual text chat, and preserves the structured English assessment and curriculum inside the product. Full chat has a fixed, prompt-safe target-language catalogue with Any-language auto-follow plus English, Spanish, French, German, Hindi, Portuguese, Italian, Japanese, Korean, Mandarin, Arabic, and Russian; the selected language reaches the model prompt without forcing lessons or changing the learner's ordinary conversation language. Adult product surfaces use the abstract graphite/pink `MilaVoiceMark`, while the former rose mascot remains archived only for a future children’s spin-off. The optional adult tone is now a discreet sparkle control whose dialog still requires explicit `Playful mode · 18+` consent and enforces non-explicit, non-dependent, user-led playfulness. Freedom pink `#ff4f9e` now leads; the original `#ff82c2` remains as a warmer friendship/love blush, with deep raspberry carrying action. A new 1200×630 global Open Graph card is live. | `8d3bd5a`, `2026ce2`, `9a406a8` (2026-07-23) | Deploy runs [`29976909668`](https://github.com/prashantpandey-creator/mila-english/actions/runs/29976909668), [`29977442821`](https://github.com/prashantpandey-creator/mila-english/actions/runs/29977442821), and final [`29977687084`](https://github.com/prashantpandey-creator/mila-english/actions/runs/29977687084) are green; final exact SHA `9a406a84a6a96d18b9b5e5294dee79891c15736e`. Live DOM title/H1/method match the global positioning; computed production tokens are `#ff4f9e`, `#ff82c2`, and CTA `rgb(217, 0, 108)`, with the voice-card gradient spanning both pink roles. Live hashed CSS contains `#ff4f9e`, `.chat-page__language`, `.chat-tone-dialog`, and `.mila-voice-mark`; the live page chunk contains `Find your voice`, `Any language`, and `Choose a language`. The settled 1280×720 layout has zero horizontal overflow, the active DOM contains the voice mark and no rose/mascot image, and the [final live full-page capture](docs/live-proof/mila-global-coming-of-age-9a406a8.png) records the result. The live `/og.png` is exactly 1200×630 and byte-identical to the committed asset. TypeScript, all 56 tests, and the production build pass. |
| Live 3D avatar preview (`/mila-live.html`) — **opt-in / experimental preview** | **A separate "video chat" surface, distinct from the voice orb.** A rigged **full-body 3D Mila** rendered client-side with **TalkingHead.js + three.js**, lip-syncing **live** (per-word visemes — not a preloaded clip). This deliberately plants the **live + full-body** corner of the photoreal/full-body/live triangle first; per 2026 SOTA a fully photoreal live full-body avatar (animatable Gaussian-splat human) needs a GPU render server and breaks the Russia-safe moat, so the avatar is treated as a swappable layer to upgrade later. **Placeholder look** (TalkingHead's stock female body — stylized-3D, NOT photoreal Mila); she speaks **canned lines** on a "Say hi" button with a browser voice. **NOT yet: not wired to the real `/api/chat` conversation (that route requires login), no room behind her, no photoreal face, and three.js/TalkingHead still load from jsdelivr (must be self-hosted for full Russia-safety).** Room pipeline (World Labs Marble Gaussian-splat → react-three-fiber, proven to render the game's `daitya_500k.ply` in-browser) and the photoreal GPU track are researched in session memory, not built. | `267f08f` (2026-07-23) | Deploy run [`29956513907`](https://github.com/prashantpandey-creator/mila-english/actions/runs/29956513907) green in 4m6s. Live `https://mila.purangpt.com/mila-live.html` returns 200 and renders the full-body avatar (live production screenshot). Self-hosted avatar `/avatar/brunette.glb` returns 200 `model/gltf-binary`, **4,721,528 bytes** (byte-exact to the committed file); it works inside Russia because it is served from our own box. Full-body render + visual lip-sync verified live in-browser. **No conversation/mic claim at this commit — fixed lines only.** |
| Photoreal 2D avatar in the companion (`/darshan?face=1`) — **opt-in / experimental** | **Opt-in photoreal Mila presence** in the voice room, in place of the abstract orb — a self-hosted looping video generated on the owner's **RunPod GPU** (RealVisXL face → LivePortrait motion, **no third-party service**), with a state-coloured ring; `faceMode` is read after mount so SSR and hydration agree (no mismatch, live console clean). The idle loop was first **too jittery** (it looped an expressive talking/laughing clip) — **fixed** to a calm gentle-smile loop (calm ~1.8 s window, slowed 2.5× + frame-blend smoothed + ping-pong seamless). Default users still see the orb; this is behind `?face=1` only. **NOT yet: not real-time lip-sync — it is an idle LOOP (the ring is the honest "speaking" cue), and its direction is superseded by the live 3D preview above.** | `a03b3f4` + calm fix `43d3928` (2026-07-23) | Avatar deploy green (2m23s); calm-fix deploy run [`29945297546`](https://github.com/prashantpandey-creator/mila-english/actions/runs/29945297546) green in 2m55s. Live `/darshan?face=1` renders the photoreal presence (production screenshot); live console clean (hydration gate holds). Self-hosted `/avatar/mila-idle.mp4` returns 200 at **158,447 bytes** (byte-exact to the deployed calm clip; the earlier jittery clip was 339,764), served `max-age=0`. |
| Minimal Mila front door (historical predecessor) | The `42424ae` release established the pared-back introduction page, voice preview, and three-step method. Its English-only promise and soft-pink-first hierarchy were superseded by the global coming-of-age Mila row above; the original live proof remains versioned. | `42424ae` (2026-07-23) | Deploy run [`29975887281`](https://github.com/prashantpandey-creator/mila-english/actions/runs/29975887281) was green; [historical live capture](docs/live-proof/mila-front-door-minimal-42424ae.png). |
| Android browser voice / microphone reliability | **Live hardening for the false “mic unavailable” path.** The guest-open `/darshan?free=1` room now seats or preserves an isolated guest session before an authenticated local fallback, while anonymous Realtime carries a stable per-browser identity instead of sharing one reduced Android Chrome user-agent rate bucket. Mila waits for the WebRTC data channel before claiming it is listening, gives transient mobile disconnects a recovery window, and cancels an in-flight connection immediately when the learner leaves so a late mic cannot remain open. The shared recorder now uses compatible `ideal` constraints, retries one transient Android device-release failure, resumes and reuses the unlocked Web Audio context across automatic turns, accepts lower-gain handset speech, cleans up constructor/runtime failures, and shows specific permission/device/Android guidance instead of collapsing auth, recorder, and hardware errors into one message. **A real spoken round-trip on the reporting Android phone is still required; this row does not claim physical-microphone confirmation.** | `c20ca1b` (2026-07-19) | Deploy run `29669830341` green in 10m15s for exact SHA `c20ca1bda1bc812f66f63dc9fe4727fdd8d83b13`. Live `/darshan?free=1` returned 200; its production chunks contain `mila-voice-device-id`, `X-Device-Id`, `audio-context-suspended`, `voice-connect-cancelled`, and the Android-specific error copy. A live 390x844 capture showed the voice room correctly and the live console had zero warnings/errors. Current-main TypeScript, all 20 `src/lib/*.test.ts` files (including new guest-session, microphone, and late-WebRTC-cancellation proofs), and the production build passed. |
| Bug reporting to owner email | **Live with an honest delivery fallback.** `/support` now has a bilingual structured bug form, automatic page/device/browser/screen/language/timezone diagnostics, spam trap, validation, and rate limiting; chat also accepts explicit English/Russian requests such as “Report this bug: …”. Reports are addressed to `fcpuru95@gmail.com`, and neither chat history nor audio is attached. The dashboard, public footer, and iOS Settings all link into the flow. **Automatic server-to-email delivery is still pending a production `RESEND_API_KEY`; until it is configured, the form returns an explicit delivery-unavailable result and opens a ready-addressed email instead of claiming success.** | `25de4ef` (2026-07-19) | Deploy run `29669283970` green in 2m54s for exact SHA `25de4ef3bc319bd9c24e452112c72ca460ac94eb`. Live `/support` DOM and mobile 390x844 screenshot verify the complete form; computed layout has `scrollWidth == clientWidth == 390`, a 366px form card, and 332px controls. Live bundles contain `/api/bug-reports`, the recipient address, `bug-report__submit`, and the no-chat/audio disclosure. A labeled production delivery probe returned the expected `503 {"error":"email_unavailable","fallback":"mailto"}`, confirming that the UI will not falsely report an email sent before the key is installed. |
| Mila origin film / first-session story | **Current front-door motion source of truth.** On a learner's first homepage view, two equal figures begin in separate paper worlds, learn to listen, make one waveform, and fold into the faceless Mila voice sculpture; the film then releases to the permanent Mineral Paper artwork. The responsive cuts retain **53 landscape / 51 portrait drawings**, all **141 hard-cut exposures at 12 fps** (11.75 s) plus a 600 ms release, while the complete **24-keyframe / 82-in-between workshop** stays versioned. There are no crossfades, optical flow, temporal ghosting, camera moves, audio, or loop. The entrance is once per browser session with explicit replay and fail-open exits for Skip, interaction, scroll, visibility, orientation, Reduced Motion, Save Data, constrained networks, autoplay rejection, stalls, and media errors. | `b139b98`, `71ea80c`, merged as `49496db` (2026-07-19) | Deploy run `29682475585` green in 4m2s for exact SHA `49496dbf7ee59044c23b09d3c94d8ab6c708011e`; `Deploy via SSH` succeeded. Live bundle contains `mila:voice-origin-story:v4` and all four v7 film/poster URLs. Desktop/mobile MP4s return 200 at **10,040,802 / 7,241,344 bytes**, accept 206 byte ranges, and all four v7 assets serve correct media types with `public, max-age=31536000, immutable`. Live in-app-browser captures at 1440×900, 390×844, and 390×664 selected the correct 2048×978 or 960×2024 film, remained in `playing` phase at the sampled frame, and had zero horizontal overflow; Skip releases cleanly to the permanent hero. Independent decoded-frame review found no P0/P1 rail, seam, pulse, blur, blend, crop, or edge artifacts. Local clean-worktree build, TypeScript, all 50 tests, strict H.264 verification, continuity audit, both localized registration gates, and the full atomic renderer passed. |
| Graphite-to-electric homepage entrance (historical predecessor) | The matched graphite-to-colour waveform development established the first one-session homepage entrance and its fail-open interaction model. It was superseded by the current responsive Mila origin-film row above; its v5 assets remain in the repository as intentional predecessors. | `a2ea21a`, merged as `1254cc8` (2026-07-19) | Historical deploy run `29664470530` was green; current front-door motion proof is recorded above. |
| Mila guide / conversation rail | **The old unlabeled square bot is retired.** On desktop and inner learning routes Mila is an explicit Talk + Chat rail with bilingual labels, a waveform state mark, neutral mineral hairlines, asymmetric conversation geometry, and restrained carbon depth. The narrow front door keeps an art-safe compact tab; opening it promotes the conversation into a near-full-height sheet. Shortcut actions stay on one horizontal rail so they no longer consume multiple rows of the transcript. Voice behavior and fallbacks are unchanged. | `4dc1ee5`, recoloured by `220a5b7` (2026-07-19) | Deploy run `29669033701` established the rail; current Mineral Paper colour proof is recorded in run `29669552383` above. Live hashed CSS contains `milaGuideWave`, `mila-guide__launcher-label`, `width:222px`, and `height:min(76dvh,660px)`; live layout JS contains both new rail classes. At 390x844 the compact front tab stays at `y=88`, the open panel is 359x764 and the shortcut rail is 54px; live `/grammar` shows the 178x52 labeled rail above the 65.5px bottom navigation. At 1280x720 the panel is 410x624 at `y=78`, below the header. All three live computed checks had `scrollWidth == clientWidth`, and the live console had zero warnings/errors. No physical microphone claim is included. |
| Mineral Paper Mila visual language | **Current source of truth for the whole site.** Marketing, pricing, auth, dashboard, chat, learning rooms, assessment, Darshan, voice lab, legal pages, navigation, and companion furniture now balance Mila's magenta with linen `#faf8f5`/`#f1ece5`, carbon `#26343b`, mineral mist `#f3f6f7`, eucalyptus `#456a60`/`#dde8e3`, and neutral line `#d8e0e3`. Broad tonal gradients provide depth; magenta-to-deep-magenta remains the primary action signal. `/` uses new desktop/mobile faceless v6 voice-sculpture art whose carbon/eucalyptus ribbons counterweight the magenta waveform. The dashboard uses one graphite-to-eucalyptus anchor panel; chat and voice use quiet material fields rather than blank pink-white space. The v3 woman artwork remains an untouched backup. | `220a5b7` (2026-07-19) | Deploy run `29669552383` green in 2m0s for exact SHA `220a5b7801c2aa6cc3213df98eb3b24fb4679d89`. Live HTML references both v6 assets; the desktop and mobile WebPs return 200 at 308,274 and 313,816 bytes. Live hashed CSS `2c70ebe2883252a2.css`, `a205ac993c00691e.css`, and `c87b46c6954091ea.css` contain `#26343b`, `#456a60`, `#faf8f5`, and the gradient anchor token. Live desktop and 390x844 front-door screenshots verify the responsive art/copy composition; separate live dashboard and Darshan screenshots verify the dark mineral anchor and eucalyptus/linen voice field. Local clean-worktree production build, TypeScript, `visualScenes.test.ts`, and contrast checks passed. |
| Electric Paper visual language (historical predecessor) | The white, blush, magenta, and plum system established Mila's stronger editorial identity and faceless v4 voice sculpture. It was superseded by the Mineral Paper row above because the pink/white distribution lacked a supporting material family and tonal depth. | `cca35c8`, merged as `4e0d313` (2026-07-19) | Historical deploy run `29662956018` was green; current visual proof is recorded above. |
| Front door `/` design (historical predecessor) | The `683aa47` conversation-poster pass established the free Talk with Mila action and level-check hierarchy. Its dark cinematic `Speak freely.` hero was superseded first by Electric Paper and then by the current Mineral Paper atelier row above. | `683aa47` (2026-07-18) | Historical deploy run `29624436105` was green; current front-door proof is recorded above. |
| Conversation-first Mila core | `/dashboard` is a Mila conversation stage instead of a widget directory: **Speak with Mila** is primary, **Chat with Mila** is second, and lessons are a quieter supporting rail. `/chat` carries Mila's identity, starter prompts, assistant portraits, and a direct voice handoff. Ordinary chat is isolated from focused-drill history; “just talk / stop correcting / stop repeating” overrides prior lesson context; fast configured-provider text turns fall back to the resident local model. Placeholder Guest names no longer leak across interface languages. | `f7cc269`, `74508b0`, `12e65a9`, merged as `7512b45`, `1c6afb7`, `60f0207` (2026-07-18) | deploy runs `29637130227`, `29637431694`, `29637788415` all green. `/dashboard`, `/chat`, `/darshan` 200; live CSS `3a9ac04649781d65.css` contains `conversation-stage__presence`, `chat-page__empty-presence`, `dashboard-conversation__main`, `chat-page__starters`; live dashboard/chat JS contains the new voice/chat copy. Desktop + 390 px live screenshots pass with no horizontal overflow. Live clicks prove dashboard→voice, dashboard→chat, chat mic→voice. The exact “Let's just talk… no repeat or correct” probe stopped the old drill and returned ordinary conversation; the final live timing probe showed first visible reply at **1.576 s**, full reply at **2.096 s**. |
| Uniform learning experience (historical foundation) | The `01ef5db` release established the shared lesson, quiz, word, metric, badge, action, feedback, and empty-state furniture used today. Its dark listening/assessment allocation, user-switchable themes, and dark `/start` room were superseded by the current Mineral Paper row above. | `41121e9`, merged as `01ef5db` (2026-07-18) | Historical deploy run `29648574693` was green in 2m10s and verified the shared route furniture at that commit. |
| Front-door clips and portrait art (retired) | The city-night, Manhattan, silk, Big Ben, café, headphone, chair, device, and v3 woman scenes are not loaded by the current front page. The former v3 portrait stays in the repository as an intentional backup; inner routes load no legacy atmosphere photography. | `220a5b7` (2026-07-19) | Live homepage HTML references only the active faceless `/visuals/v6/mila-mineral-voice-*-v1.webp` hero art plus the connected v4 city rhythm strip; both v6 assets return 200. |
| App-wide headings | globals `h1,h2` now use Yeseva One (loaded at layout level, not just landing) | `421fd86` | in-bundle |
| Voice/Piper TTS | `/api/tts` serves real WAV | prior | 200 + RIFF WAV |
| Cohesive inner-app theme (historical predecessor) | The `ec2e6ff` Atelier/Studio pass first unified shell, card, control, navigation, assistant, auth/legal, and learning geometry. Its colour and route-surface allocation is superseded by the current Electric Paper row above. | `d11ee49`, merged as `ec2e6ff` (2026-07-18) | Historical deploy `29625886226` verified the predecessor geometry; current production proof is recorded above. |
| iOS reviewer surfaces | Bilingual `/privacy`, `/support`, and permanent authenticated account/guest deletion | `18d5811` (2026-07-17) | deploy run `29580794980` green; both pages 200 with [privacy](docs/app-store-assets/1.0/live-reviewer-proof/privacy.png) and [support](docs/app-store-assets/1.0/live-reviewer-proof/support.png) screenshots; disposable guest deletion 200 then profile 401 |
| `/pia` — Hindi/Hinglish companion | **Pia** (renamed from Pila, `6f35e4a`), Mila's flirty Hindi sister: guest-open voice room, opens in Hindi, cheesy pet names. Rides the **OpenAI Realtime** path (same as the English companion — the only Hindi-capable engine here), `mode=pia` in `buildRealtimeSession`. **No new container.** Realtime-only room (no en/ru-local fallback). | `3450b0d` + rename `6f35e4a` (2026-07-18) | rename went live via run `29624973946`; then host-split `c728a1d` landed and is serving: **on `mila.purangpt.com`, `/pia` now 307-redirects to `/` and `/pila` 404s** (verified live). Pia is reachable only once `pia.purangpt.com` DNS + Caddy vhost exist — **owner/server-side, still pending**. **NOT yet verified: the spoken Hindi audio itself (needs a mic tap on prod).** |
| Voice examiner: one question per turn + understands Russian | The level-check EXAMINER no longer bundles 3–5 questions into one turn (`EXAMINER_INSTRUCTIONS`: "Ask ONE question at a time… never stack") and its ASR is no longer English-locked — assessment transcription auto-detects so a learner's Russian fallback is understood, while the interview is still conducted and measured in English. Coach stays English-pinned; companions already auto-detected. Guarded by `src/lib/assessment.test.ts` assertions so a concurrent reset can't silently wipe it again (that happened once). | `6504e73` (2026-07-18) | deploy run `29624973946` green — run log shows the box at `HEAD is now at 6504e73` and the final in-container `localhost:3000` check 200; `npx tsc --noEmit` clean and all `assessment.test.ts` assertions pass at that commit; live `/assessment` 200 with screenshot; unauthenticated `POST /api/session?mode=assessment` correctly 401-gates. (Instructions are server-side config sent to OpenAI Realtime — they never appear in the client bundle, so bundle-grep does not apply to this change.) |
| Session management: login wall + guest chat isolation | **Live. Supersedes the prior guest-open `/darshan` front-door model.** The app is login-gated: `src/middleware.ts` protects `/darshan` (the main voice room) plus every product route (chat, lessons, dashboard, account, billing, voice-lab, assessment, progress…). The marketing/legal/auth front stays public: `/`, `/start`, `/pricing`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/privacy`, `/terms`, `/refunds`, `/support`. Guests are no longer auto-seeded — `ensureGuestSession()` became the check-only `hasActiveSession()`; a guest exists ONLY via the deliberate "Continue as guest" control on `/login`/`/register` (which now state that guest chats aren't saved). Guest conversations are never persisted or served as history (`companionStore` `isGuestUser` guards + `/api/chat/history` returns `{"messages":[]}` for guests); a guest's in-turn context comes from the client transcript (`companionHistory.ts`, unit-tested). Registered learners keep their own isolated durable history. `scripts/clear-chat-history.mjs` (wired into the Docker CMD, no-op unless `MILA_CLEAR_CHAT_HISTORY` is `guests`/`all`) purges already-stored rows — **RUN 2026-07-22 (WIPE-ALL): 262 messages / 40 threads / 0 memories deleted, tables now 0/0/0.** Repeatable on demand via the gated `.github/workflows/purge-chat-history.yml` manual workflow (`workflow_dispatch`, confirm `WIPE-ALL` or `WIPE-GUESTS`), which SSHes with `VPS_SSH_KEY` and runs the same script; every deploy takes a verified `VACUUM INTO` backup first. `/pia` (separate hidden Hindi product on its own host) intentionally out of scope. | `ae7e98d` (PR #32, 2026-07-22) | Deploy run `29955274899` green (`Deploy via SSH` success, 20:28→20:33Z) for merge SHA `ae7e98d2e570d1445490298bcc7e84265907c725`. Live prod, no cookie: `/darshan`, `/darshan?free=1`, `/dashboard`, `/chat`, `/voice-lab` all **307 → `/login?returnTo=…`** (query preserved); `/`, `/login`, `/register`, `/pricing`, `/privacy`, `/terms`, `/support`, `/start` all **200**. An explicit `POST /api/auth/guest` returns `accountType=guest`, whose cookie then loads `/darshan` **200** and `/api/chat/history` **`{"messages":[]}`**; a no-cookie history call is **401** (no silent guest). Local `npx tsc --noEmit` clean; `guestSession` + `companionHistory` tests pass (only `visualScenes` fails — needs `ffprobe`, unrelated). History wipe: purge workflow run `29957082065` success — log `mode=ALL wiped 262 messages, 40 threads, 0 remembered facts`, post-purge `messages=0 threads=0 memories=0`. |

## LOCAL / UNPUSHED

- The Apple Distribution IPA remains local only because App Store Connect is
  waiting for an interactive Apple ID sign-in and app-record creation before
  validation/upload.

## OWED (asked, NOT done — do not claim these)

- The former voice-chat / Mila-bot UI refinement debt is closed by the live
  guide row above. Continue to treat physical-device voice/microphone checks
  and the App Store submission items below as separate release work rather than
  silently folding them into the web-design claim.

---

## Deploy (the only path to "live")

**Pipeline GREEN again (2026-07-18): the 01:19–02:00 UTC red streak is
diagnosed and fixed. Read this before touching LLM memory settings.**
Six straight deploys died at `Ollama … warm-up status 500` while the site
served fine. Root cause — proven with the new read-only `diagnose.yml`
workflow (runs `29625992299`, `29626140024`) — was NOT host RAM (31GiB total,
23.6GiB available, no swap, disk 39%): an out-of-band `docker update`, never
committed to git, had capped `mila-llm` at 6GiB/3cpu and `mila-voice-llm` at
3GiB/2cpu — most plausibly an emergency brake applied right after the 01:19
green run's HTTPS freeze window. gpt-oss:20b needs ~14GiB anon (Ollama 0.32
loads with mmap off), so every load was a guaranteed cgroup OOM kill
(`dmesg: CONSTRAINT_MEMCG … Killed process (llama-server) anon-rss ~6.2GiB`).
That means prod local chat was hard-down under those caps, not merely deploys
red. Compose never healed it because `docker update` is invisible to compose's
config hash — five `up -d` runs left the strangled containers untouched.
Fix shipped 2026-07-18 — commit `e36069e`, deploy run `29626342384` **GREEN**
in 12m47s, the first since 01:19: both LLM containers `Recreated`, `local chat
model warmed` on the first attempt, the voice warm-up 500'd once and the new
retry caught it, both residencies `ready`; after the run `/` and `/assessment`
200 from outside and purangpt.com still answering (no freeze-window casualty).
What changed: `docker-compose.prod.yml` now declares ALL LLM limits
(chat 16g, voice 6g, memswap pinned) and the next deploy recreates both
containers back to git truth; the workflow's warm-up + residency checks are
retried and then become `::warning::` lines instead of hard failures (the
same pattern the speech services already used), and every deploy now warns
when live container limits drift from compose. **Green now means "the app is
serving" — model-residency truth lives in the run-log tail; read it whenever
local chat/voice latency matters.** If the LLMs ever need strangling again,
edit the two `mem_limit` lines in `docker-compose.prod.yml` — in git — and
deploys stay green while saying so.

Push to `main` → `.github/workflows/deploy.yml` SSHes to Mumbai
(`209.182.233.163`), `git reset --hard origin/main`, rebuilds compose. ~2–4 min.
**The workflow starts containers BY EXPLICIT NAME** — adding a service to
`docker-compose.prod.yml` is not enough; add it to the `up`/health lists in the
workflow too, same commit.

**Box vitals without SSH:** `.github/workflows/diagnose.yml`
(workflow_dispatch) reads memory/disk/docker stats/`ollama ps`/OOM
kills/compose-drift over the deploy key, strictly read-only. `gh workflow run
diagnose.yml --ref main`, then read the run log. Local Macs have no key to the
Mumbai box — this is the sanctioned door.

## Gotchas that have burned real time
- **SWR stale doc:** `/` is statically prerendered, served
  `s-maxage=31536000, stale-while-revalidate`. First fetch after a deploy can
  return the PREVIOUS build once. Verify by grepping the *hashed CSS chunk*, and
  hard-refresh on device.
- **One bright room system** (`src/lib/routeSurface.ts`): every route resolves
  to `welcome` / light. Do not reintroduce route-specific dark focus rooms or
  device-preference palette changes; hierarchy comes from linen paper, carbon
  structure, eucalyptus atmosphere, magenta action, broad tonal gradients,
  typography, borders, and restrained shadows.
- **Fresh worktree = no dev DB.** `DATABASE_URL="file:./dev.db" npx prisma db
  push` before guest/login flows work locally, or they 500.
- **Concurrent sessions** push to this repo. `git fetch` + rebase onto
  `origin/main` before every push; never force.
- **Post-deploy freeze window (observed 2026-07-18, run `29624973946`):** for
  several minutes right after a green deploy, the box can stop answering HTTPS
  entirely — TCP connects but the TLS handshake never completes, and BOTH
  `mila.purangpt.com` and `purangpt.com` vanish (one Caddy on the Mumbai box
  serves both hostnames). External probes confirmed it wasn't client-side. Best
  fit: the workflow warms two resident Ollama models (~16GB) right as it exits
  green, and the memory/CPU spike starves Caddy. It self-recovered in ~5 min.
  Don't declare an outage or redeploy inside this window — wait it out first.

---

## 2026-07-17 — Mila native iOS 1.0 release

This section records Apple release claims with identifiers and verification
evidence. The app-specific procedure is in
[`docs/IOS_APP_STORE_RELEASE_RUNBOOK.md`](docs/IOS_APP_STORE_RELEASE_RUNBOOK.md).

### Release manifest

- App Store name: `Mila: English Speaking`
- Display name: `Mila`
- Bundle ID: `com.purangpt.mila`
- Version/build: `1.0 (1)`
- Apple team: `8U3RHGA83G`
- Platform: iPhone, iOS 16+
- Production origin: `https://mila.purangpt.com`
- Privacy URL: `https://mila.purangpt.com/privacy`
- Support URL: `https://mila.purangpt.com/support`

### Product evidence

- Native SwiftUI Home, Learn, Speak, Chat, Progress, and Account surfaces.
- Account-free isolated guest bootstrap.
- Native microphone recording to Mila private transcription, controlled tutor
  reply, and neural TTS playback.
- Native offline phrases, native lesson/vocabulary reading, and learner progress.
- In-app permanent deletion for registered accounts and guest data.
- Deep web modules are limited to the complete level check, listening, grammar,
  privacy, and support flows.

### Verification status

- [x] Clean iOS simulator compile with Xcode 26.6 / iOS 26.5 SDK.
- [x] Native runtime verified on iPhone 17 Pro Max simulator (iOS 26.5):
  Home, Learn, Speak, Progress, guest bootstrap, and live private tutor journey.
- [x] Production guest, profile, vocabulary, progress, private transcription,
  streamed tutor, and WAV TTS endpoints verified from the release client path.
- [x] Five 6.9-inch screenshots captured at `1320×2868` from the passing UI
  journey in `docs/app-store-assets/1.0/screenshots-6.9-inch/`.
- [ ] Microphone, transcription, chat, TTS, and deletion verified on physical iPhone.
- [x] Public privacy and support URLs deployed and rechecked with live screenshots.
- [x] Production deletion verified with a disposable guest: delete 200, then
  profile 401 using the same session.
- [x] Apple bundle ID created.
- [ ] App Store app record created.
- [x] Release archive exported as an Apple Distribution-signed IPA.
- [ ] `altool` validation passed (currently awaiting the App Store app record).
- [ ] Build uploaded and processing completed.
- [ ] App Privacy published.
- [ ] Review submission state `WAITING_FOR_REVIEW`.
- [ ] App Store version state `WAITING_FOR_REVIEW`.

### Apple release identifiers

- Production merge commit: `18d5811aa556322f2ff094262c2b264a351fe28b`
- Production deployment run: `29580794980` (success)
- Bundle ID resource ID: `54MZM2T7K9`
- Apple app ID: pending
- App Store version ID: pending
- Build ID: pending
- Upload/delivery ID: pending
- Review submission ID: pending
- Submitted UTC: pending

The release is not complete until the two final `WAITING_FOR_REVIEW` checks are
witnessed above.
