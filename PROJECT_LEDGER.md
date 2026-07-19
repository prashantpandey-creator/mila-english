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
| Graphite-to-electric homepage entrance | **Live front-door motion layer.** On the first homepage view in a browser session, Mila's matched graphite voice sculpture appears first, an electric-magenta waveform develops the artwork into the permanent colour sculpture, and the page then stays still. It never loops, stops immediately on scroll/tap/key input, and skips decorative motion for Reduced Motion or Save Data. Independent image readiness keeps the colour scene usable if graphite fails and preserves graphite if the colour asset fails. No A-ha footage, people, characters, story, or composition is copied. | `a2ea21a`, merged as `1254cc8` (2026-07-19) | Deploy run `29664470530` green for exact SHA `1254cc84c85ede11374fcae622b52851e70fe049`; `Deploy via SSH` succeeded. Live CSS contains `milaElectricDevelop`, `milaElectricDevelopMobile`, `milaGraphiteRelease`, and the colour-failure guard; live JS contains the once-per-session key plus both v5 asset paths. Desktop 1440x900 and mobile 390x844 live captures verify graphite-first and final cleanup (`complete`, zero sketch layers), with zero horizontal overflow and no console warnings/errors. Both v5 WebPs return 200 at 244,376 and 261,698 bytes; seven representative routes return 200. |
| Electric Paper Mila visual language | **Current source of truth for the whole site.** Marketing, pricing, auth, dashboard, chat, lessons, listening, assessment, voice rooms, phonetics, progress, achievements, legal pages, and companion furniture now share one stronger Electric Paper house: ground `#fffcfe`, raised paper `#fff4fa`, band `#ffe8f3`, accessible action magenta `#d9006c`, decorative flare `#ff2d95`, deep plum `#75003f`, and ink `#26131f`. Electric flare is decorative only; normal CTA and text contrast use the deeper action range. `/` uses separate desktop/mobile faceless voice-sculpture art with no woman, person, headphones, chair, devices, flags, landmarks, or postcard imagery. Its three city cards crop one connected abstract rhythm panorama. The previous v3 woman artwork remains an untouched backup and has no runtime reference. **Speak with Mila** stays the primary dashboard action, and the mobile companion launcher remains fixed and reachable while scrolling. The darker pricing moment is preserved as a contained plum featured plan rather than a black route theme. | `cca35c8`, merged as `4e0d313` (2026-07-19) | deploy run `29662956018` green in 1m56s; `Deploy via SSH` succeeded for exact SHA `4e0d3138e41b7e4482d7861af49ed81980060c47`. Seventeen live probes returned 200 and auth-gated `/phonetics` correctly redirected to `/login` 200. Live desktop 1440x900 and true mobile 390x844 screenshots verify `/visuals/v4/mila-electric-voice-desktop-v1.webp`, `/visuals/v4/mila-electric-voice-mobile-v1.webp`, the connected `/visuals/v4/mila-city-rhythms-strip-v1.webp`, the voice-first dashboard, and the unified Listen page. Live computed audits of `/`, `/dashboard`, `/listen`, `/assessment`, `/darshan`, `/start`, and `/login` found zero visible off-palette blue/green/cyan signals and zero horizontal overflow. On mobile the guide remained fixed at `y=88` before and after a 1,800px scroll. Full spoken round-trip remains a physical-microphone check, not claimed from browser automation. |
| Front door `/` design (historical predecessor) | The `683aa47` conversation-poster pass established the free Talk with Mila action and level-check hierarchy. Its dark cinematic `Speak freely.` hero was superseded by the current white/pink editorial atelier row above. | `683aa47` (2026-07-18) | Historical deploy run `29624436105` was green; current front-door proof is recorded above. |
| Conversation-first Mila core | `/dashboard` is a Mila conversation stage instead of a widget directory: **Speak with Mila** is primary, **Chat with Mila** is second, and lessons are a quieter supporting rail. `/chat` carries Mila's identity, starter prompts, assistant portraits, and a direct voice handoff. Ordinary chat is isolated from focused-drill history; “just talk / stop correcting / stop repeating” overrides prior lesson context; fast configured-provider text turns fall back to the resident local model. Placeholder Guest names no longer leak across interface languages. | `f7cc269`, `74508b0`, `12e65a9`, merged as `7512b45`, `1c6afb7`, `60f0207` (2026-07-18) | deploy runs `29637130227`, `29637431694`, `29637788415` all green. `/dashboard`, `/chat`, `/darshan` 200; live CSS `3a9ac04649781d65.css` contains `conversation-stage__presence`, `chat-page__empty-presence`, `dashboard-conversation__main`, `chat-page__starters`; live dashboard/chat JS contains the new voice/chat copy. Desktop + 390 px live screenshots pass with no horizontal overflow. Live clicks prove dashboard→voice, dashboard→chat, chat mic→voice. The exact “Let's just talk… no repeat or correct” probe stopped the old drill and returned ordinary conversation; the final live timing probe showed first visible reply at **1.576 s**, full reply at **2.096 s**. |
| Uniform learning experience (historical foundation) | The `01ef5db` release established the shared lesson, quiz, word, metric, badge, action, feedback, and empty-state furniture used today. Its dark listening/assessment allocation, user-switchable themes, and dark `/start` room were superseded by the current Electric Paper row above. | `41121e9`, merged as `01ef5db` (2026-07-18) | Historical deploy run `29648574693` was green in 2m10s and verified the shared route furniture at that commit. |
| Front-door clips and portrait art (retired) | The city-night, Manhattan, silk, Big Ben, café, headphone, chair, device, and v3 woman scenes are not loaded by the current front page. The former v3 portrait stays in the repository as an intentional backup; inner routes load no legacy atmosphere photography. | `cca35c8`, merged as `4e0d313` (2026-07-19) | Live homepage DOM references only the active faceless `/visuals/v4/mila-electric-voice-*-v1.webp` art; the city rail references the v4 rhythm strip, and live Listen contains zero flag controls or legacy scene images. |
| App-wide headings | globals `h1,h2` now use Yeseva One (loaded at layout level, not just landing) | `421fd86` | in-bundle |
| Voice/Piper TTS | `/api/tts` serves real WAV | prior | 200 + RIFF WAV |
| Cohesive inner-app theme (historical predecessor) | The `ec2e6ff` Atelier/Studio pass first unified shell, card, control, navigation, assistant, auth/legal, and learning geometry. Its colour and route-surface allocation is superseded by the current Electric Paper row above. | `d11ee49`, merged as `ec2e6ff` (2026-07-18) | Historical deploy `29625886226` verified the predecessor geometry; current production proof is recorded above. |
| iOS reviewer surfaces | Bilingual `/privacy`, `/support`, and permanent authenticated account/guest deletion | `18d5811` (2026-07-17) | deploy run `29580794980` green; both pages 200 with [privacy](docs/app-store-assets/1.0/live-reviewer-proof/privacy.png) and [support](docs/app-store-assets/1.0/live-reviewer-proof/support.png) screenshots; disposable guest deletion 200 then profile 401 |
| `/pia` — Hindi/Hinglish companion | **Pia** (renamed from Pila, `6f35e4a`), Mila's flirty Hindi sister: guest-open voice room, opens in Hindi, cheesy pet names. Rides the **OpenAI Realtime** path (same as the English companion — the only Hindi-capable engine here), `mode=pia` in `buildRealtimeSession`. **No new container.** Realtime-only room (no en/ru-local fallback). | `3450b0d` + rename `6f35e4a` (2026-07-18) | rename went live via run `29624973946`; then host-split `c728a1d` landed and is serving: **on `mila.purangpt.com`, `/pia` now 307-redirects to `/` and `/pila` 404s** (verified live). Pia is reachable only once `pia.purangpt.com` DNS + Caddy vhost exist — **owner/server-side, still pending**. **NOT yet verified: the spoken Hindi audio itself (needs a mic tap on prod).** |
| Voice examiner: one question per turn + understands Russian | The level-check EXAMINER no longer bundles 3–5 questions into one turn (`EXAMINER_INSTRUCTIONS`: "Ask ONE question at a time… never stack") and its ASR is no longer English-locked — assessment transcription auto-detects so a learner's Russian fallback is understood, while the interview is still conducted and measured in English. Coach stays English-pinned; companions already auto-detected. Guarded by `src/lib/assessment.test.ts` assertions so a concurrent reset can't silently wipe it again (that happened once). | `6504e73` (2026-07-18) | deploy run `29624973946` green — run log shows the box at `HEAD is now at 6504e73` and the final in-container `localhost:3000` check 200; `npx tsc --noEmit` clean and all `assessment.test.ts` assertions pass at that commit; live `/assessment` 200 with screenshot; unauthenticated `POST /api/session?mode=assessment` correctly 401-gates. (Instructions are server-side config sent to OpenAI Realtime — they never appear in the client bundle, so bundle-grep does not apply to this change.) |

## LOCAL / UNPUSHED

- The refreshed Apple Distribution IPA is local at
  `ios/build/export/Mila.ipa` with SHA-256
  `3668e9f4d4863deecb519aaec921a3137e9d7aba9a7436a3b2ed9fc20b30ef06`.
  App Store Connect still requires an interactive Apple sign-in and app-record
  creation before validation/upload.

## OWED (asked, NOT done — do not claim these)

- No open route-uniformity debt is recorded. Continue to treat physical-device
  voice/microphone checks and the App Store submission items below as separate
  release work rather than silently folding them into the web-design claim.

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
  device-preference palette changes; hierarchy comes from white, cool blush,
  rose, deep berry, typography, borders, and restrained shadows.
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
- [x] App Store Connect metadata, review notes, age rating, pricing/content
  rights, exact App Privacy answers, and upload-and-submit checklist finalized
  under `docs/app-store-assets/1.0/`.
- [x] Release preflight script verifies metadata limits, public reviewer URLs,
  screenshots, App Store icon, privacy manifest, Apple Distribution signing,
  binary identity, production origin, export compliance, and IPA checksum.
- [ ] Microphone, transcription, chat, TTS, and deletion verified on physical iPhone.
- [ ] App Review contact phone confirmed.
- [ ] Account-level DSA trader status and eligible territories confirmed.
- [x] Public privacy and support URLs deployed and rechecked with live screenshots.
- [x] Production deletion verified with a disposable guest: delete 200, then
  profile 401 using the same session.
- [x] Apple bundle ID created.
- [ ] App Store app record created.
- [x] Release archive re-exported on 2026-07-19 as an Apple
  Distribution-signed IPA with the finalized privacy manifest; local preflight
  passed for SHA-256
  `3668e9f4d4863deecb519aaec921a3137e9d7aba9a7436a3b2ed9fc20b30ef06`.
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
