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

## Design system (current — Direction A, chosen in Figma 2026-07-17)
- **Type:** Yeseva One (display, `--lp-font-serif`) + Caveat (handwritten accents,
  `--lp-font-accent`), loaded app-wide in `src/app/layout.tsx`. Both full Cyrillic.
- **Palette (welcome/light rooms):** rose `#cf4f7d` / `#b83866`, blush paper
  `#fff0f7`, espresso ink. Per-door accents via `--door-accent/soft/line`.
- **Footage:** `src/lib/visualScenes.ts`. Front-door pool = night-city clips.
  **Never put reading-faces / café-people clips on the front door** (owner
  rejected — wrong signal for the Russia market). Frame-check every clip by eye
  (ffmpeg still) before using it.
- **Two rooms:** `src/lib/routeSurface.ts` splits routes into `welcome` (light)
  and `focus` (dark). Check both when styling.

## Where things live
- Front door: `src/app/page.tsx` + `src/app/landing.css` (`.lp-*` namespace).
- App shell / inner rooms: `src/components/ui/AppShell.tsx` + `globals.css`.
- Voice companion / Mila bot: `src/components/MilaGuide.tsx`.
