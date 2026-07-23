import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://mia.purangpt.com'),
  title: 'Mia — Meet the world in its own words',
  description: 'A boho travel-and-language home for travelers, learners, and people curious about the cultures behind the words.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mia — Meet the world in its own words',
    description: 'Find the words, read the room, and join the moment—wherever you land.',
    type: 'website',
    url: '/',
    images: [{ url: '/mia-og.png', width: 1200, height: 630, alt: 'Mia — Meet the world in its own words' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mia — Meet the world in its own words',
    description: 'Find the words, read the room, and join the moment—wherever you land.',
    images: ['/mia-og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5efe4',
  colorScheme: 'light',
};

export default function MiaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
