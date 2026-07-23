# Mila, Gia, and Mia host split

## Decision

Mila, Gia, and Mia are three focused product surfaces served by the same
application and account system:

- `mila.purangpt.com` is the language-learning product: personal lessons,
  listening, pronunciation, vocabulary, grammar, assessment, and progress.
- `gia.purangpt.com` is the adult voice-and-text AI companion: Gia's live
  synthetic-presence chamber at the apex and text conversation at `/chat`.
- `mia.purangpt.com` is the public traveler product: an editorial home for
  real-world language, culture, and deeper travel. Its conversation actions
  hand off explicitly to Gia, while structured learning hands off to Mila.
- `miachat.purangpt.com` is a legacy hostname that permanently redirects to
  the matching Gia path.

The split keeps Gia's near-future companion identity, Mia's tactile traveler
identity, and Mila's focused learning interface from collapsing into one
ambiguous product.

## Host behavior

- `gia.purangpt.com/` internally renders the existing `/darshan` voice
  chamber while keeping the clean apex URL.
- `mia.purangpt.com/` internally renders the public `/mia` travel-and-culture
  page while keeping the clean apex URL.
- Mila `/darshan` and `/chat` links redirect to the corresponding Gia
  location.
- Mia chat, voice, and account links redirect to Gia; Mia and Gia learning
  URLs redirect to their equivalent Mila locations.
- Mila's bottom navigation contains Home, Learn, and Progress only.
- Mila's dashboard links to Gia as a separate product rather than an
  internal app section.

Host matching is exact. Gia's apex is protected in middleware before the host
rewrite runs, so it has the same explicit sign-in-or-guest gate as the direct
voice route. Mia's apex remains public.

## Identity and sessions

All three hosts use the same application container. Gia and Mila share the
existing account system, database, plans, and conversation history.
Authentication cookies remain host-only deliberately; Mia links into Gia for
sign-in instead of pretending to own a separate traveler account. The product
does not broaden the session cookie to every `purangpt.com` subdomain.

## Companion identity

User-facing companion copy now names the AI and product `Gia`.
The text and Realtime prompts use that identity on `/chat` and `/darshan`.
Focused speaking practice inside Mila keeps the Mila learning identity.

The three synthetic portraits remain visual presences for one AI companion.
They do not select a different model, personality, privacy mode, or adult
setting. The unfinished Private voice mode remains absent; the chamber is
Live-only after its explicit OpenAI audio disclosure.

## Traveler identity

Mia uses warm paper, deep petrol, clay, moss, and bougainvillea as a modern
nomad editorial system. Its promise is “Meet the world in its own words.”
It serves travelers, language learners, and people curious about cultures
without turning places into stereotypes or travel clichés.

Gia remains the named AI companion inside Mia's conversation handoff. Mia is
the traveler product; Gia is the companion; Mila is the structured learning
product.

## Production routing

DNS for `gia.purangpt.com` and `mia.purangpt.com` resolves to the existing
Mumbai origin. The
deployment runs `scripts/configure-gia-proxy.sh` after the application
container is healthy. The script:

1. resolves the single running Caddy container and its bind-mounted Caddyfile;
2. adds idempotent Gia and Mia reverse proxies to `mila:3000`;
3. validates and reloads Caddy;
4. restores the timestamped backup if validation or reload fails.

The deploy then waits for Gia's HTTPS login page and a `200` response from
Mia's public apex, covering certificate issuance and both product routes before
the release can pass.
