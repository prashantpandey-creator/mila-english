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

## Design system (current — white/pink editorial house, owner correction 2026-07-18)
- **Type:** Yeseva One is reserved for the Mila wordmark and rare editorial
  display moments. Manrope owns product headings, interface, and body copy. IBM
  Plex Mono is only for measured language such as IPA and levels. All support
  Cyrillic.
- **Palette:** cool white ground `#fffdfd`, white panel `#ffffff`, blush raised
  surface `#fff7fa`, berry ink `#2f1b24`, muted ink `#75606a`, rose hairline
  `#efd6df`, action rose `#b63d68`, and deep action `#8d2d50`. These are the
  whole product palette. No category, route, state, price band, or voice room
  gets cyan, emerald, gold, orange, purple, beige, or black.
- **Depth:** solid paper is the default. Translucent white is limited to sticky
  chrome where it preserves context; use rose-tinted shadows sparingly. Never
  use coloured glass, glow, or a gradient orb as decoration.
- **Front-door art:** `src/lib/visualScenes.ts` points to the commissioned
  white/pink mixed-media editorial portrait in `public/visuals/v3/`. The idea is
  a learner finding her own voice: handmade paper, expressive portrait, torn
  edges, ribbon, petals, and waveform marks with generous negative space.
  **Never use headphones, chairs, desks, devices, classrooms, flags, landmark
  postcards, generic country photos, or stock-learning scenes in this hero.**
- **One identity:** `src/lib/routeSurface.ts` resolves every route to the same
  light atelier. Voice state is expressed with labels, motion, rings, and
  waveform geometry—not a dark canvas or a route-specific accent.

## Where things live
- Front door: `src/app/page.tsx` + `src/app/landing.css` (`.lp-*` namespace).
- App shell / inner rooms: `src/components/ui/AppShell.tsx` + `globals.css`.
- Voice companion / Mila bot: `src/components/MilaGuide.tsx`.
