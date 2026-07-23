# Mila Avatar Presence v2

## Product boundary

Mila, Ember, and Nocturne are three visual looks for the same adult language
and travel companion. Selecting a look changes only the portrait. It does not
select an LLM, change conversation instructions, alter audio handling, or
unlock an adult tone.

The existing voice-state meter remains wrapped around every avatar:

- muted graphite at rest;
- eucalyptus while listening;
- carbon while thinking;
- freedom pink while speaking.

The unfinished private/local companion mode is temporarily removed from both
the UI and runtime. Eligible preview or Pro accounts can use Live voice only
after its separate, explicit OpenAI-audio consent; everyone else continues in
text chat.

## Production assets

- `public/avatar/presences/mila-v2/avatar.webp`
- `public/avatar/presences/ember-v2/avatar.webp`
- `public/avatar/presences/nocturne-v2/avatar.webp`

Each production asset is a 900×900 WebP intended for a circular UI crop.

## Provenance

The v2 set was created on 2026-07-23 with the built-in OpenAI ImageGen
workflow. Mila was generated as a new original fictional adult identity.
Ember and Nocturne were style-transformed only from Mila's own fictional v1
production portraits; no real-person or celebrity reference was supplied to
the v2 production workflow.

The prompts required a cohesive premium semi-realistic 3D digital-human style,
centered head-and-shoulders framing, direct eye contact, generous circular-crop
padding, adult styling, and an uncluttered mineral/eucalyptus studio palette.
They prohibited real-person resemblance, logos, text, watermarks, headsets,
fantasy costumes, sexualized styling, and busy props.

Reference-derived campaign concepts remain in ignored local storage and are
not production identities.
