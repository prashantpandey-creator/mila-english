// Pia is Mila's hidden sister. She lives ONLY on her own domain
// (pia.purangpt.com) and is deliberately absent from the public Mila domain —
// a secret shared by word of mouth, never linked. These host-scoped rules
// enforce that split at the edge:
//   • on pia.purangpt.com  → her voice room sits at the apex (/ → /pia)
//   • on mila.purangpt.com → /pia does not exist; a stray poke lands on the
//     front door, revealing nothing.
// Local dev (localhost) matches neither host, so /pia stays directly reachable
// for testing. Hosts are overridable via env for staging.
const MILA_HOST = process.env.MILA_HOST || 'mila.purangpt.com';
const PIA_HOST = process.env.PIA_HOST || 'pia.purangpt.com';

const config = {
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/reset-password',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        source: '/verify-email',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        source: '/visuals/v7/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/avatar/presences/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: PIA_HOST }],
        destination: '/pia',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/pia',
        has: [{ type: 'host', value: MILA_HOST }],
        destination: '/',
        permanent: false,
      },
    ];
  },
};
export default config;
