import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://gia.purangpt.com'),
  title: 'Gia — Live voice with Gia',
  description: 'A playful, multilingual AI companion for natural live voice conversation.',
  appleWebApp: { capable: true, title: 'Gia', statusBarStyle: 'black-translucent' },
  openGraph: {
    title: 'Gia — Live voice with Gia',
    description: 'A playful, multilingual AI companion for natural live voice conversation.',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gia — Live voice with Gia',
    description: 'A playful, multilingual AI companion for natural live voice conversation.',
  },
};

export default function GiaVoiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
