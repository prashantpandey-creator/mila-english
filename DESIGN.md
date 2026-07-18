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

## The language (owner correction, 2026-07-19)

Mila has one **Electric Paper** identity from the first page through the
learning product. It should feel authored, warm without relying on a literal
woman's face, strong without becoming cyberpunk, and creative without becoming
noisy. There is no second dark room and no route-specific colour story.

| Role | Canonical value |
|---|---|
| Ground | cool white `#fffcfe` |
| Panel | white `#ffffff` |
| Raised / quiet surface | electric blush `#fff4fa` |
| Strong blush band | `#ffe8f3` |
| Ink | berry-black `#26131f` |
| Muted ink | `#65535f` |
| Border | electric hairline `#f0c7da`; strong line `#e58bb5` |
| Interaction signal | accessible magenta `#d9006c`; deep action `#a40050`; decorative flare `#ff2d95`; plum plate `#75003f` |

- **Type.** Yeseva One (`--font-display`) carries the wordmark and rare
  editorial phrases. Manrope (`--font-sans`) carries product headings,
  interface, and body copy. IBM Plex Mono (`--font-mono`) is reserved for IPA,
  phonemes, scores, levels, and system labels. Do not add a route-specific font.
- **One signal.** Clickable, active, listening, speaking, correct, incorrect,
  measured, and progress states all use the magenta family. Meaning comes from
  icon, label, motion, shape, and opacity—not cyan/green/gold/purple switches.
- **Depth.** Use solid white/blush surfaces, electric hairlines, and restrained
  plum offset plates. The primary voice action and feature imagery may carry a
  soft electric halo. Translucent white is allowed only for sticky chrome where
  the layer relationship must remain visible.
- **Voice.** Mila's voice state is made legible through a label, waveform,
  concentric ring rhythm, and motion. It remains on white and blush; a black
  room is not required for focus.
- **Editorial character.** The front door is a commissioned faceless
  ribbon-and-resin voice sculpture with real negative space. The city editions
  crop one connected abstract rhythm panorama. Across the product, character
  comes from scale, hard shadow, tactile edges, and asymmetrical rhythm—not
  faces, stock travel cards, flags, devices, glass thumbnails, or tech clichés.
- **Graphite entrance.** On a learner's first homepage view in a browser
  session, Mila's waveform develops the faceless sculpture from an original
  graphite drawing into electric material. It runs once, settles permanently
  into colour, stops immediately on interaction, and is skipped for Reduced
  Motion or Save Data. It never copies characters, footage, or narrative from
  another work and never becomes a persistent background loop.

**Banned:** dusty rose, mauve, secondary semantic hues, per-category colour
coding, black route surfaces, coloured glass, indiscriminate neon glow, gradient
orbs, device-driven palette switching, face-led heroes, generic country/flag
cards, and low-resolution photos behind learning workspaces.

## Built so far

- `src/app/inner-theme.css` owns the shared white/pink tokens, shell, cards,
  controls, lesson tools, assessment, chat, auth, legal pages, assistant
  furniture, and mobile navigation.
- `src/components/RouteSurface.tsx` makes the palette deterministic. `/`,
  `/start`, pricing, ordinary learning, and immersive voice all use the same
  light atelier.
- Voice motion is functional feedback. It uses magenta rings, a precise core mark,
  and state labels on white; it does not introduce another palette.
- The dashboard is a **conversation stage**, not a widget directory. Mila's
  live voice action owns the visual hierarchy, text chat is the clear second
  action, and lessons sit in a quieter supporting rail. `conversation-stage`
  and `chat-page__empty-presence` are the reference compositions for carrying
  that hierarchy from the dashboard into the actual conversation surface.
- The hierarchy is behavioral too: ordinary chat and the voice room are real
  conversation by default. Drills belong to focused practice; a learner asking
  to "just talk", stop correcting, or change topic overrides earlier lesson
  context immediately.
