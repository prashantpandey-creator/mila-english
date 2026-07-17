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
| Front door `/` design | **Direction A boho** — Yeseva One + Caveat type, rose `#cf4f7d`, blush paper sections `#fff0f7`, arch city photos, night-city clips | `421fd86` (2026-07-17) | live CSS has `Yeseva`+`cf4f7d`+`fff0f7`; old `#d63d72` gone; screenshot verified |
| Front-door clips | city-night-bokeh / us-manhattan / woman-silk / uk-bigben-night. **The café-people clips (woman-cafe-laptop, woman-city-phone) are CUT** — owner rejected the reading-faces on a Russia front door | `421fd86` | `woman-cafe-laptop` absent from live DOM |
| App-wide headings | globals `h1,h2` now use Yeseva One (loaded at layout level, not just landing) | `421fd86` | in-bundle |
| Voice/Piper TTS | `/api/tts` serves real WAV | prior | 200 + RIFF WAV |
| Inner-app shell | `AppShell`/`AppHeader`/`AppMain`, safe-area nav, pink-noir focus rooms | `e40a155` | live |

## LOCAL / UNPUSHED
(none currently — worktree `/tmp/mila-uni-wt` merged & pushed as `421fd86`;
remove it once confirmed.)

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
