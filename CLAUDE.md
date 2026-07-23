# CLAUDE.md — Mila

Guidance for Claude Code working in this repo. **Read `PROJECT_LEDGER.md` first**
for the current live state.

## What Mila is
Mila is a multilingual coming-of-age companion: language, confidence,
curiosity, and growing into your own voice through honest conversation. The
global front door and full chat can follow any language; the existing structured
curriculum remains a pronunciation-first English program for Russian speakers.
Live at
**https://mila.purangpt.com** (Mumbai box `209.182.233.163`, behind Caddy).
Next.js 15 app + self-hosted voice stack (Piper TTS, faster-whisper ASR,
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

## Design system (current — Mineral Paper atelier, owner refinement 2026-07-19)
- **Type:** Yeseva One is reserved for the Mila wordmark and rare editorial
  display moments. Manrope owns product headings, interface, and body copy. IBM
  Plex Mono is only for measured language such as IPA and levels. All support
  Cyrillic.
- **Palette:** linen ground `#faf8f5`, white panel `#ffffff`, mineral mist
  `#f3f6f7`, warm linen `#f1ece5`, eucalyptus mist `#dde8e3`, graphite ink
  `#26343b`, muted ink `#5e6a6a`, and neutral hairline `#d8e0e3`. Accessible
  magenta `#d9006c`, deep action `#a40050`, and freedom pink `#ff4f9e` form
  Mila's bold signature; the softer sampled blush `#ff82c2` carries warmth,
  friendship, and love as a supporting tint rather than the main signal.
  Eucalyptus `#456a60`/`#5f7d72` is the supporting counterweight for
  listening, measurement, progress, and atmosphere—not a category rainbow.
- **Depth:** solid paper is the default, supported by broad planar gradients:
  graphite-to-eucalyptus for one anchor panel, linen-to-mist for quiet bands,
  and magenta-to-deep-magenta for primary action. Translucent white is limited
  to sticky chrome. Never spread neon glow across every surface or use coloured
  glass, gradient orbs, or SaaS-style floating blobs.
- **Front-door art:** `src/lib/visualScenes.ts` points to the commissioned
  faceless mineral-paper voice sculpture in `public/visuals/v6/`, with separate
  desktop/mobile compositions. Carbon/eucalyptus ribbons balance the magenta
  waveform. A matching graphite pair in `public/visuals/v5/` registers the
  final transition. The v7 origin film in `public/visuals/v7/` uses 12
  registered narrative anchors plus curated AI-authored geometric in-betweens:
  53 landscape drawings and 51 portrait drawings, both held across 141
  hard-cut exposures at 12 fps. The complete workshop remains versioned. Two equal,
  faceless paper figures arrive from organic and geometric worlds; their voice
  lines meet and their shared ribbons wind continuously into Mila. The silent
  film is 11.75s followed by a 600ms registered graphite-to-mineral release. It
  runs once per session, exposes a visible bilingual Skip control, and never
  loops, crossfades drawings, uses optical flow, blocks interaction, or runs
  under Reduced Motion, Save Data, or a constrained effective network. It
  borrows no character, portal, shot, or
  narrative sequence from another work. The prior
  woman portrait remains untouched in `public/visuals/v3/` as backup only. City
  cards crop one connected abstract rhythm strip rather than literal destination
  photography. **Never use faces,
  headphones, chairs, desks, devices, classrooms, flags, landmark postcards,
  generic country photos, or stock-learning scenes in the active hero.**
- **One identity:** `src/lib/routeSurface.ts` resolves every route to the same
  light mineral atelier. Voice state is expressed with labels, motion, rings,
  waveform geometry, and the shared material palette—not a route-specific skin.
- **Adult Mila has no mascot:** the launcher, chat, dashboard, login, and
  registration use `MilaVoiceMark`, an abstract graphite-and-pink signal. The
  rose character file remains versioned only as a possible asset for a future,
  separately branded children's app; do not put it back into the adult product.
- **Global front door:** lead with finding your voice, not English proficiency.
  Multilingual conversation is the broad entry point; structured English
  assessment and lessons remain available inside the product. Never use flags
  or cultural stereotypes to represent language choice.
- **Personality:** default Mila has grounded girl-next-door ease: attentive,
  witty, unpretentious, and user-led. Full text chat may expose the device-local
  adult mood behind a discreet control, but the consent surface must say
  `Playful mode · 18+` explicitly while the expression stays subtle. Light
  swearing and suggestive banter mirror the learner rather than leading them;
  never use explicit sexual role-play, love-bombing, possessiveness,
  exclusivity, submission, or dependency tactics.

## Where things live
- Front door: `src/app/page.tsx` + `src/app/landing.css` (`.lp-*` namespace).
- App shell / inner rooms: `src/components/ui/AppShell.tsx` + `globals.css`.
- Voice companion / Mila bot: `src/components/MilaGuide.tsx`.
