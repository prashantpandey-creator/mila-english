import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://miachat.purangpt.com'),
  title: 'MiaChat — Text with Mia',
  description: 'A warm, multilingual AI companion for thoughtful, natural conversation.',
  openGraph: {
    title: 'MiaChat — Text with Mia',
    description: 'A warm, multilingual AI companion for thoughtful, natural conversation.',
    type: 'website',
    url: '/chat',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MiaChat — Text with Mia',
    description: 'A warm, multilingual AI companion for thoughtful, natural conversation.',
  },
};

export default function MiaChatTextLayout({ children }: { children: React.ReactNode }) {
  return children;
}
