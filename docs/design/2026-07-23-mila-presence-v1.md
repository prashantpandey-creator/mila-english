# Mila Presence v1 — provenance and product boundary

## Product boundary

Mila Presence changes only how the existing voice companion appears. It does
not select an LLM, unlock an adult tone, change conversation instructions, or
claim live lip-sync. `Signal` remains the default. `Ember` and `Nocturne` are
optional synthetic portrait windows with the same honest listening, thinking,
and speaking state treatment.

Audio handling is intentionally separate from appearance. Private voice is the
default. The free front-door route can offer one durable, server-consumed Live
preview per explicit account after its OpenAI audio disclosure; the query
string itself grants nothing. Ongoing Live voice remains a Pro feature and uses
the paid server mode.

The hidden `?kids=1` path was removed from Mila's shared voice room. A future
children's companion belongs in the separately branded Lumi product with
separate data and safety rules.

## Portrait provenance

The two production portraits were generated on 2026-07-23 with OpenAI's
built-in ImageGen workflow. No input or reference images were supplied to
either production generation.

- `public/avatar/presences/ember-v1/poster.jpg`
  - Original fictional adult with a copper bob, freckles, graphite tailoring,
    and a blue-hour railway-lounge setting.
- `public/avatar/presences/nocturne-v1/poster.jpg`
  - Original fictional adult with short dark curls, a small original botanical
    tattoo, graphite tailoring, and a hotel-library setting.

Both prompts explicitly required an original synthetic character, prohibited
resemblance to celebrities or real people, and excluded sexualized styling,
logos, text, watermarks, flags, and tourist clichés.

Campaign concepts derived from supplied photographs are stored only under the
ignored local `campaigns/private-concepts/` directory. They are not part of the
product build and must not be published or used as companion identities without
photographer rights and the subject's written likeness and digital-replica
consent.

## Retired prototype

`public/mila-live.html` and `public/avatar/brunette.glb` were removed from the
public build. The GLB matched a non-commercial example asset from the
TalkingHead project and therefore was unsuitable for Mila's commercial product.
The Git history remains the recovery record; the files must not be restored
without separate commercial rights.
