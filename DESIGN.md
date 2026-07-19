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

## The language (owner refinement, 2026-07-19)

Mila has one **Mineral Paper** identity from the first page through the
learning product. It keeps Electric Paper's authored magenta signature, but
balances it with graphite, linen, and eucalyptus so the experience has tonal
depth instead of reading as pink on white. It should feel warm without relying
on a literal woman's face, strong without becoming cyberpunk, and creative
without becoming noisy. There is no second route-specific colour story.

| Role | Canonical value |
|---|---|
| Ground | linen paper `#faf8f5` |
| Panel | white `#ffffff` |
| Raised / quiet surface | mineral mist `#f3f6f7` |
| Alternating band | eucalyptus mist `#dde8e3`; warm linen `#f1ece5` |
| Ink | graphite `#26343b`; mid-carbon `#40525a` |
| Muted ink | `#5e6a6a` |
| Border | mineral hairline `#d8e0e3`; strong line `#a9bab6` |
| Calm counterweight | eucalyptus `#456a60`; mid `#5f7d72` |
| Interaction signal | accessible magenta `#d9006c`; deep action `#a40050`; decorative flare `#ff2d95`; plum plate `#75003f` |

- **Type.** Yeseva One (`--font-display`) carries the wordmark and rare
  editorial phrases. Manrope (`--font-sans`) carries product headings,
  interface, and body copy. IBM Plex Mono (`--font-mono`) is reserved for IPA,
  phonemes, scores, levels, and system labels. Do not add a route-specific font.
- **One signature.** Magenta identifies Mila, primary action, and the live
  voice signal. Eucalyptus supports listening, measurement, progress, and calm
  surfaces; it is a counterweight, not a route-by-route rainbow. Meaning still
  comes from icon, label, motion, shape, and explicit language.
- **Depth.** Use linen/mineral surfaces, neutral hairlines, one graphite anchor
  panel, and restrained plum offset plates. Broad sectional gradients may move
  within one material family: graphite-to-eucalyptus, linen-to-mist, or
  magenta-to-deep-magenta. Translucent white is limited to sticky chrome where
  the layer relationship must remain visible.
- **Voice.** Mila's voice state is made legible through a label, waveform,
  concentric ring rhythm, and motion. Linen, carbon, and eucalyptus carry the
  atmosphere while magenta marks the active signal.
- **Editorial character.** The front door is a commissioned faceless
  ribbon-and-resin voice sculpture with real negative space. The city editions
  crop one connected abstract rhythm panorama. Across the product, character
  comes from scale, hard shadow, tactile edges, and asymmetrical rhythm—not
  faces, stock travel cards, flags, devices, glass thumbnails, or tech clichés.
- **Graphite entrance.** On a learner's first homepage view in a browser
  session, two equal faceless paper figures begin inside different visual
  languages: one organic, one geometric. Their separate voice-lines meet, the
  boundary between the worlds dissolves, and the shared folds become Mila's
  voice sculpture before Mila's mineral colour arrives. The original seven-state
  silent story is slow (9.6s desktop / 8.4s mobile), runs once, has a visible
  bilingual Skip control, settles permanently into colour, yields to deliberate
  page interaction or a meaningful scroll, and is skipped for Reduced Motion or
  Save Data. It never copies characters, footage,
  portals, shots, or narrative sequences from another work and never becomes a
  persistent background loop.

**Banned:** dusty rose, mauve, per-category rainbow coding, black route
surfaces, coloured glass, indiscriminate neon glow, gradient orbs/blobs,
device-driven palette switching, face-led heroes, generic country/flag cards,
and low-resolution photos behind learning workspaces.

## Built so far

- `src/app/inner-theme.css` owns the shared mineral-paper tokens, shell, cards,
  controls, lesson tools, assessment, chat, auth, legal pages, assistant
  furniture, and mobile navigation.
- `src/components/RouteSurface.tsx` makes the palette deterministic. `/`,
  `/start`, pricing, ordinary learning, and immersive voice all use the same
  light atelier.
- Voice motion is functional feedback. It uses a carbon/eucalyptus material
  field, magenta active rings, a precise core mark, and explicit state labels.
- The dashboard is a **conversation stage**, not a widget directory. Mila's
  live voice action owns the visual hierarchy, text chat is the clear second
  action, and lessons sit in a quieter supporting rail. `conversation-stage`
  and `chat-page__empty-presence` are the reference compositions for carrying
  that hierarchy from the dashboard into the actual conversation surface.
- The hierarchy is behavioral too: ordinary chat and the voice room are real
  conversation by default. Drills belong to focused practice; a learner asking
  to "just talk", stop correcting, or change topic overrides earlier lesson
  context immediately.
