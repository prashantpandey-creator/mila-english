import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://mia.purangpt.com'),
  title: 'Mia — Feel the place. Speak its language.',
  description: 'Step into India, Bali, and destinations around the world through atmosphere, useful local language, real replies, and cultural context.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mia — Feel the place. Speak its language.',
    description: 'Step into India, Bali, and destinations around the world through language, atmosphere, and real-life moments.',
    type: 'website',
    url: '/',
    images: [{ url: '/mia-og-v2.jpg', width: 1200, height: 630, alt: 'Mia — Feel the place. Speak its language.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mia — Feel the place. Speak its language.',
    description: 'Step into India, Bali, and destinations around the world through language, atmosphere, and real-life moments.',
    images: ['/mia-og-v2.jpg'],
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
