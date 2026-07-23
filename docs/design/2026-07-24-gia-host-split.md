# Mila and Gia host split

## Decision

Mila and Gia are now two focused product surfaces served by the same
application and account system:

- `mila.purangpt.com` is the language-learning product: personal lessons,
  listening, pronunciation, vocabulary, grammar, assessment, and progress.
- `gia.purangpt.com` is the adult voice-and-text AI companion: Gia's live
  synthetic-presence chamber at the apex and text conversation at `/chat`.
- `miachat.purangpt.com` is a legacy hostname that permanently redirects to
  the matching Gia path.

The split keeps the companion's near-future identity without making Mila's
learning dashboard feel like a companion introduction page.

## Host behavior

- `gia.purangpt.com/` internally renders the existing `/darshan` voice
  chamber while keeping the clean apex URL.
- Mila `/darshan` and `/chat` links redirect to the corresponding Gia
  location.
- Gia learning URLs redirect to their equivalent Mila locations.
- Mila's bottom navigation contains Home, Learn, and Progress only.
- Mila's dashboard links to Gia as a separate product rather than an
  internal app section.

Host matching is exact. The Gia apex is protected in middleware before the
host rewrite runs, so it has the same explicit sign-in-or-guest gate as the
direct voice route.

## Identity and sessions

Both hosts use the same application container, user database, plans, and
conversation history. Authentication cookies remain host-only deliberately;
users sign in once on Gia with their existing Mila account (or explicitly
continue as a guest). The product does not broaden the session cookie to every
`purangpt.com` subdomain.

## Companion identity

User-facing companion copy now names the AI and product `Gia`.
The text and Realtime prompts use that identity on `/chat` and `/darshan`.
Focused speaking practice inside Mila keeps the Mila learning identity.

The three synthetic portraits remain visual presences for one AI companion.
They do not select a different model, personality, privacy mode, or adult
setting. The unfinished Private voice mode remains absent; the chamber is
Live-only after its explicit OpenAI audio disclosure.

## Production routing

DNS for `gia.purangpt.com` resolves to the existing Mumbai origin. The
deployment runs `scripts/configure-gia-proxy.sh` after the application
container is healthy. The script:

1. resolves the single running Caddy container and its bind-mounted Caddyfile;
2. adds an idempotent Gia reverse proxy to `mila:3000`;
3. validates and reloads Caddy;
4. restores the timestamped backup if validation or reload fails.

The deploy then waits for the Gia HTTPS login page, covering certificate
issuance and public routing before the release can pass.
