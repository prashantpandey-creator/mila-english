import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://miachat.purangpt.com'),
  title: 'MiaChat — Live voice with Mia',
  description: 'A playful, multilingual AI companion for natural live voice conversation.',
  appleWebApp: { capable: true, title: 'MiaChat', statusBarStyle: 'black-translucent' },
  openGraph: {
    title: 'MiaChat — Live voice with Mia',
    description: 'A playful, multilingual AI companion for natural live voice conversation.',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MiaChat — Live voice with Mia',
    description: 'A playful, multilingual AI companion for natural live voice conversation.',
  },
};

export default function MiaChatVoiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
