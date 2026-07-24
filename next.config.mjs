// Host-scoped product split:
//   • on pia.purangpt.com  → her voice room sits at the apex (/ → /pia)
//   • on mila.purangpt.com → /pia does not exist; a stray poke lands on the
//     front door, revealing nothing.
//   • on gia.purangpt.com → Gia's companion voice room sits at the apex.
//   • on mia.purangpt.com → Mia's public travel/culture front door sits at
//     the apex and hands conversation to Gia.
//   • on mila.purangpt.com → voice/chat routes move to Gia, while the
//     learning product keeps its dashboard, curriculum, and progress.
//   • on miachat.purangpt.com → legacy links redirect to Gia.
// Local dev (localhost) matches neither host, so /pia stays directly reachable
// for testing. Hosts are overridable via env for staging.
const MILA_HOST = process.env.MILA_HOST || 'mila.purangpt.com';
const PIA_HOST = process.env.PIA_HOST || 'pia.purangpt.com';
const GIA_HOST = process.env.GIA_HOST || 'gia.purangpt.com';
const MIA_HOST = process.env.MIA_HOST || 'mia.purangpt.com';
const LEGACY_MIACHAT_HOST = process.env.LEGACY_MIACHAT_HOST || 'miachat.purangpt.com';
const MILA_LEARNING_ROUTES = [
  '/dashboard',
  '/assessment/:path*',
  '/lessons/:path*',
  '/listen/:path*',
  '/phonetics/:path*',
  '/practice/:path*',
  '/progress',
  '/vocabulary/:path*',
  '/grammar/:path*',
  '/achievements',
  '/voice-lab/:path*',
];

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
    // These host-owned apexes must run before Next resolves the filesystem
    // root page. Array-form rewrites are too late for an existing `/` route,
    // which left Mia and authenticated Gia rendering Mila's homepage.
    return {
      beforeFiles: [
        {
          source: '/',
          has: [{ type: 'host', value: PIA_HOST }],
          destination: '/pia',
        },
        {
          source: '/',
          has: [{ type: 'host', value: GIA_HOST }],
          destination: '/darshan',
        },
        {
          source: '/',
          has: [{ type: 'host', value: MIA_HOST }],
          destination: '/mia',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      ...[GIA_HOST, MIA_HOST].flatMap((host) => MILA_LEARNING_ROUTES.map((source) => ({
          source,
          has: [{ type: 'host', value: host }],
          destination: `https://${MILA_HOST}${source}`,
          permanent: false,
        }))),
      {
        source: '/:path*',
        has: [{ type: 'host', value: LEGACY_MIACHAT_HOST }],
        destination: `https://${GIA_HOST}/:path*`,
        permanent: true,
      },
      {
        source: '/pia',
        has: [{ type: 'host', value: MILA_HOST }],
        destination: '/',
        permanent: false,
      },
      {
        source: '/darshan',
        has: [{ type: 'host', value: MILA_HOST }],
        destination: `https://${GIA_HOST}/`,
        permanent: false,
      },
      {
        source: '/chat',
        has: [{ type: 'host', value: MILA_HOST }],
        destination: `https://${GIA_HOST}/chat`,
        permanent: false,
      },
      {
        source: '/chat',
        has: [{ type: 'host', value: MIA_HOST }],
        destination: `https://${GIA_HOST}/chat`,
        permanent: false,
      },
      {
        source: '/darshan',
        has: [{ type: 'host', value: MIA_HOST }],
        destination: `https://${GIA_HOST}/`,
        permanent: false,
      },
      ...['/login', '/register', '/account'].map((source) => ({
        source,
        has: [{ type: 'host', value: MIA_HOST }],
        destination: `https://${GIA_HOST}${source}`,
        permanent: false,
      })),
      {
        source: '/darshan',
        has: [{ type: 'host', value: GIA_HOST }],
        destination: `https://${GIA_HOST}/`,
        permanent: false,
      },
      {
        source: '/mia',
        has: [{ type: 'host', value: MIA_HOST }],
        destination: `https://${MIA_HOST}/`,
        permanent: true,
      },
      {
        source: '/mia',
        has: [{ type: 'host', value: MILA_HOST }],
        destination: `https://${MILA_HOST}/`,
        permanent: false,
      },
      {
        source: '/mia',
        has: [{ type: 'host', value: GIA_HOST }],
        destination: `https://${GIA_HOST}/`,
        permanent: false,
      },
    ];
  },
};
export default config;
