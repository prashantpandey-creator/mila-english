import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://gia.purangpt.com'),
  title: 'Gia — Text with Gia',
  description: 'A warm, multilingual AI companion for thoughtful, natural conversation.',
  openGraph: {
    title: 'Gia — Text with Gia',
    description: 'A warm, multilingual AI companion for thoughtful, natural conversation.',
    type: 'website',
    url: '/chat',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gia — Text with Gia',
    description: 'A warm, multilingual AI companion for thoughtful, natural conversation.',
  },
};

export default function GiaTextLayout({ children }: { children: React.ReactNode }) {
  return children;
}
