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
| Front door `/` design | **Conversation poster** — one full-bleed cinematic hero, free Talk with Mila action first, level check second, solid three-outcome proof band, then a Studio pronunciation proof. The duplicate intro and glass thumbnail rail are removed. | `683aa47` (2026-07-18) | deploy run `29624436105` green; live HTML/CSS contains `Speak freely.`, `lp-hero__proofbar`, `#111217`, and the desktop assistant offset; live desktop + mobile screenshots verified with the correct responsive art and no horizontal overflow/assistant overlap |
| Front-door clips | city-night-bokeh / us-manhattan / woman-silk / uk-bigben-night. **The café-people clips (woman-cafe-laptop, woman-city-phone) are CUT** — owner rejected the reading-faces on a Russia front door | `421fd86` | `woman-cafe-laptop` absent from live DOM |
| App-wide headings | globals `h1,h2` now use Yeseva One (loaded at layout level, not just landing) | `421fd86` | in-bundle |
| Voice/Piper TTS | `/api/tts` serves real WAV | prior | 200 + RIFF WAV |
| Inner-app shell | `AppShell`/`AppHeader`/`AppMain`, safe-area nav, pink-noir focus rooms | `e40a155` | live |
| iOS reviewer surfaces | Bilingual `/privacy`, `/support`, and permanent authenticated account/guest deletion | `18d5811` (2026-07-17) | deploy run `29580794980` green; both pages 200 with [privacy](docs/app-store-assets/1.0/live-reviewer-proof/privacy.png) and [support](docs/app-store-assets/1.0/live-reviewer-proof/support.png) screenshots; disposable guest deletion 200 then profile 401 |
| `/pila` — Hindi/Hinglish companion | **Pila**, Mila's flirty Hindi sister: guest-open voice room, opens in Hindi, cheesy pet names. Rides the **OpenAI Realtime** path (same as the English companion — the only Hindi-capable engine here), `mode=pila` in `buildRealtimeSession`. **No new container.** Realtime-only room (no en/ru-local fallback). | `3450b0d` (2026-07-18) | deploy run `29623988302` green; live `mila.purangpt.com/pila` 200 with `Pila`/`Chhuo`/`Baat shuru`/`sun rahi hoon` in bundle; live screenshot verified. **NOT yet verified: the spoken Hindi audio itself (needs a mic tap on prod).** |

## LOCAL / UNPUSHED

- No unpushed product code. The Apple Distribution IPA remains local only
  because App Store Connect is waiting for an interactive Apple ID sign-in and
  app-record creation before validation/upload.

## OWED (asked, NOT done — do not claim these)
1. **"Make the flow intuitive."** The information architecture / navigation flow
   has NOT been reworked. Front-door visuals are done; the *flow* is untouched.
2. **Inner-room visual uniformity check.** Type + shell landed app-wide, but
   dashboard/lessons/listen were NOT visually verified after the theme merge
   (local guest-session 500 blocked it; prod has its own DB). Verify on prod.
3. **Voice-chat / Mila-bot UI refinement.** Bot floats bottom-right (square +
   shadow) and is live; owner asked to "refine more" — open.

---

## Deploy (the only path to "live")

Push to `main` → `.github/workflows/deploy.yml` SSHes to Mumbai
(`209.182.233.163`), `git reset --hard origin/main`, rebuilds compose. ~2–4 min.
**The workflow starts containers BY EXPLICIT NAME** — adding a service to
`docker-compose.prod.yml` is not enough; add it to the `up`/health lists in the
workflow too, same commit.

## Gotchas that have burned real time
- **SWR stale doc:** `/` is statically prerendered, served
  `s-maxage=31536000, stale-while-revalidate`. First fetch after a deploy can
  return the PREVIOUS build once. Verify by grepping the *hashed CSS chunk*, and
  hard-refresh on device.
- **Two-room system** (`src/lib/routeSurface.ts`): every route is `welcome`
  (light, e.g. `/`, dashboard) or `focus` (dark, practice rooms). Any page
  styling must be checked in BOTH rooms.
- **Fresh worktree = no dev DB.** `DATABASE_URL="file:./dev.db" npx prisma db
  push` before guest/login flows work locally, or they 500.
- **Concurrent sessions** push to this repo. `git fetch` + rebase onto
  `origin/main` before every push; never force.

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
