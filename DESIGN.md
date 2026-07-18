# Mila — design language & method

> Owner directive, 2026-07-18: the old UI (translucent glass cards, glow, a pink
> orb) was rigid and cheap — it was the *homogenized default* the 2026 award
> galleries are actively dismantling. This file exists so no one starts a screen
> from `theme.ts` and refills that template again.

## The method — diverge before you converge

1. **Start outside our code.** Pull 3–5 real references from the world first.
   Never open `theme.ts` / reach for `C.venus` first. Rigidity is a *starting
   point*, not a taste.
2. **One organizing idea, not a pile of effects.** Each direction is a concept
   ("Mila as printed matter", "Mila as a studio console") that dictates type,
   space, and colour. Effects don't get a vote.
3. **Three-plus worlds, then choose.** Generate genuinely different directions
   (type-led / texture-led / grid-led) and put them side by side before
   committing.
4. **Ban the crutches out loud.** Per direction, forbid the defaults: **no
   glass, no glow, no gradient orbs.** Constraints are the engine of novelty.
5. **Prototype the bold one in the browser; judge it against the reference,**
   not against our old screens. If it drifts back to the template, kill it.
6. **Lock the winner into the system** so it stops getting swapped for cheap
   defaults by the next hand.

## The language (chosen 2026-07-18)

Two modes of one system. Monospace threads both, so IPA and phonemes are native
in either.

| | **Atelier — light** | **Studio — dark** |
|---|---|---|
| Ground | warm paper `#f3ede0` | near-black console `#0c0d11` |
| Borders | hairline `#cabfa6` | hairline `#24262e` |
| Ink | `#1c1611` | `#eceae4` |
| Grain | warm-brown feTurbulence on `soft-light` (NEVER grey/`multiply` — that's the washed-out bug) | faint desaturated, `soft-light` |

- **Type.** Serif (`--font-serif`, Lora) for the spoken **word** — warmth.
  Monospace (`--font-mono`, IBM Plex Mono) for **everything measured** — IPA,
  phonemes, VU, labels. Sans (`--font-sans`, Manrope) for body.
- **Signal red `#e5352b`** (dark: `#ff5a4d`) — one accent, used for the *live*
  state, the flagged syllable, the peak. Never decoration.
- **Route-line** — syllables are stations on a line; the mispronounced one is
  flagged red like a missed stop. (Harvested from world 3 "Signal".)
- **VU meter** — the voice reading: green → amber → red by level, a plain-language
  tip, clarity as a side gauge. (Harvested from world 4 "Broadcast".)

**Banned:** pink, glass blur cards, glow, gradient orbs, low-res photo
backgrounds behind the workspace.

## Built so far

- `src/app/inner-theme.css` is the app-wide implementation. It owns the shared
  Atelier/Studio tokens, shell, cards, controls, lesson tools, assessment,
  chat, auth, legal pages, assistant furniture, and mobile navigation.
- `src/components/RouteSurface.tsx` deliberately separates marketing from the
  learning product. `/` keeps its cinematic poster and `/start` keeps its dark
  conversion/pricing room; every other route receives the unified app system.
- Immersive voice rooms use the Studio palette and signal red for a live state.
  Their reactive WebGL presence is functional feedback, not decorative glow.
- The dashboard is a **conversation stage**, not a widget directory. Mila's
  live voice action owns the visual hierarchy, text chat is the clear second
  action, and lessons sit in a quieter supporting rail. `conversation-stage`
  and `chat-page__empty-presence` are the reference compositions for carrying
  that hierarchy from the dashboard into the actual conversation surface.
- The hierarchy is behavioral too: ordinary chat and the voice room are real
  conversation by default. Drills belong to focused practice; a learner asking
  to "just talk", stop correcting, or change topic overrides earlier lesson
  context immediately.
