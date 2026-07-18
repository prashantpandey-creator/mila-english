# CLAUDE.md — Mila

Guidance for Claude Code working in this repo. **Read `PROJECT_LEDGER.md` first**
for the current live state.

## What Mila is
Pronunciation-first English app for Russian speakers. Live at
**https://mila.purangpt.com** (Mumbai box `209.182.233.163`, behind Caddy).
Next.js 14 app + self-hosted voice stack (Piper TTS, faster-whisper ASR,
wav2vec2 phoneme scorer, local Ollama LLM). "Works in Russia, no VPN" because
the voice services are self-hosted, not third-party.

## The one rule: proof, or it didn't happen
The owner has been burned by "LIVE" claims that were really unpushed local
worktrees. **Never report a UI/product change as done without:**
1. `git push origin main` and a **green** deploy run (`gh run watch`).
2. Grep the **live** bundle at `mila.purangpt.com` for the new values.
3. A **screenshot of the live URL** (not localhost) for visual changes.
Give the owner the clickable link every time. A local screenshot is progress,
not proof.

## Commands
```bash
npm run dev                 # local dev (:3000)
npx tsc --noEmit            # the real correctness gate (build ignores TS errors)
DATABASE_URL="file:./dev.db" npx prisma db push   # seed a fresh worktree's DB
```

## Deploy
Push `main` → `.github/workflows/deploy.yml` (SSH to Mumbai, reset --hard,
compose build). **Containers start BY NAME in the workflow** — a new compose
service must also be added to the workflow's up/health lists in the same commit.

## Design system (current — one Mila language, owner correction 2026-07-18)
- **Type:** Yeseva One for brand/display, Manrope for interface/body, IBM Plex
  Mono only for measured language such as IPA and levels. All support Cyrillic.
- **Palette:** warm paper `#f8f4ee`, ivory panel `#fffaf5`, espresso ink
  `#241d19`, muted ink `#746861`, hairline `#d9cec2`, and one rose family:
  `#c94f5b` for marks, contrast-safe `#963640` for light-surface actions, and
  `#e46a73` on dark canvases. No category or state gets another hue.
- **Dark context:** the liked pricing band and immersive voice canvases may use
  neutral near-black, but their only chromatic signal is the same rose family.
- **Footage:** `src/lib/visualScenes.ts`. Front-door pool = night-city clips.
  **Never put reading-faces / café-people clips on the front door** (owner
  rejected — wrong signal for the Russia market). Frame-check every clip by eye
  (ffmpeg still) before using it.
- **One identity:** `src/lib/routeSurface.ts` keeps marketing and ordinary learning pages on
  warm paper. Only full-screen voice routes use the neutral dark canvas. Never
  use device preference or a route-specific accent to recolour the product.

## Where things live
- Front door: `src/app/page.tsx` + `src/app/landing.css` (`.lp-*` namespace).
- App shell / inner rooms: `src/components/ui/AppShell.tsx` + `globals.css`.
- Voice companion / Mila bot: `src/components/MilaGuide.tsx`.
