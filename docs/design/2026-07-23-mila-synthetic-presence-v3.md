# Gia Synthetic Presence v3

> Product update, 2026-07-24: this chamber now belongs to Gia at
> `gia.purangpt.com`; the primary companion is named Gia. The asset path
> retains `mila-v3` as historical provenance.

## Product direction

Darshan is now a near-future companion chamber rather than a soft portrait
atelier. Gia, Ember, and Nocturne remain visual interfaces for one adult
language companion. Selecting a presence still changes appearance only; it
does not select a model, persona, audio pipeline, privacy mode, or adult tone.

The design makes the machine visible without making the companion cold:

- predominantly human faces and expressions;
- restrained cranial seams, optical rings, cheek interfaces, and engineered
  neck structures;
- a graphite chamber with subtle telemetry, scan lines, and magenta signal;
- a radial 32-segment voice-state meter around the portrait;
- distinct signal colours for Mila, Ember, and Nocturne;
- an explicit synthetic-image/voice disclosure.

The unfinished Private voice mode remains absent. Darshan is still Live-only
for eligible accounts after explicit OpenAI-audio consent, with text chat as
the honest alternative when Live is unavailable.

## Production assets

- `public/avatar/presences/mila-v3/avatar.webp`
- `public/avatar/presences/ember-v3/avatar.webp`
- `public/avatar/presences/nocturne-v3/avatar.webp`

Each production asset is a 900×900 WebP intended for the circular diagnostic
aperture.

## Provenance and reference boundary

The v3 set was produced on 2026-07-23 with the built-in OpenAI image-generation
workflow.

Mila was generated from the adult woman-in-black photograph supplied by the
project owner in this task. The final instruction explicitly asked to preserve
that reference woman's facial character and auburn hair while adapting the
source into a non-sexualized, head-and-shoulders synthetic-companion portrait.
The project owner is responsible for any likeness/publicity clearance required
for publication.

Ember and Nocturne were transformed from the project's existing v2 fictional
portraits. All three outputs are AI-generated synthetic depictions; no real
person supplies the in-product voice.

## Final image prompts

### Mila

> Create Mila as an elegant human–robot hybrid directly based on the adult
> woman in the supplied photograph. Preserve her recognizable facial
> structure, blue-green eyes, long straight auburn-red hair, natural skin
> character, confident gentle expression, and grounded photographic realism.
> Adapt the full-body source into a square, centered head-and-upper-shoulders
> avatar with enough room for a circular crop. Keep human skin and hair
> dominant. Restrict the synthetic treatment to a hairline-thin
> smoked-titanium temple seam, a narrow translucent cheek/jaw panel, one quiet
> magenta optical ring, and a slim precision neck interface. Retain a warm,
> believable near-future apartment with practical bokeh, black high-neck
> wardrobe, natural pores and fine hairs. The result must read as a real
> photograph first and an android second. No text, logo, watermark, circular
> mask, plastic skin, exposed brain, gore, damage, helmet, bulky armour, or
> sexualized styling.

### Ember

> Preserve the existing fictional Ember face, expression, copper-red wavy bob,
> freckles, direct gaze, and centered head-and-shoulders composition. Reimagine
> her as a premium cinematic human–robot hybrid with a delicate
> copper/graphite temple seam, a small translucent cheek interface, one warm
> amber optical ring with a magenta calibration glint, and a narrow porcelain
> neck collar. Keep realistic skin dominant and synthetic details to roughly
> 15–20 percent. Place her in a near-black graphite interface chamber with a
> restrained amber-to-magenta halo. Plausible editorial sci-fi, not cosplay;
> no text, watermark, circular mask, gore, horror, helmet, bulky armour, or
> sexualized styling.

### Nocturne

> Preserve the existing fictional Nocturne face, expression, short dark curls,
> skin tone, direct gaze, gold-hoop spirit, and botanical shoulder tattoo.
> Reimagine her as a premium cinematic human–robot hybrid with an
> obsidian/smoked-silver temple seam, a slim translucent violet-magenta
> cheek/jaw interface, one cool violet optical ring, and a narrow graphite
> precision neck collar. Keep realistic skin dominant and synthetic details to
> roughly 15–20 percent. Place her in a near-black graphite interface chamber
> with a restrained violet-to-magenta halo. Calm, self-possessed editorial
> sci-fi; no text, watermark, circular mask, gore, horror, helmet, bulky
> armour, or sexualized styling.

## Interface implementation

- `src/components/voice/MilaPresence.tsx` owns the aperture, 32-segment radial
  meter, scan pass, reticles, identity label, and per-presence signal.
- `src/components/voice/MilaAurora.tsx` keeps the light atelier for Pia and adds
  an opt-in `synthetic` shader variant for Darshan.
- `src/app/inner-theme.css` scopes the dark chamber to `/darshan`; the rest of
  Mila remains on the Mineral Paper system.
- `src/lib/presences.ts` is the closed three-presence catalogue and points only
  at the production v3 assets.

## Local verification

- TypeScript passes.
- All 59 tests pass.
- The production build passes.
- Desktop and 390×844 visual checks show no horizontal or vertical overflow.
- The picker exposes all three v3 assets and each selected portrait resolves to
  the expected source.
- No microphone was activated during visual verification.
