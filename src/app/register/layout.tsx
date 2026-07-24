import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { isGiaHostname } from '@/lib/productHosts';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  if (isGiaHostname(requestHeaders.get('host'))) {
    const title = 'Join Gia';
    const description = 'Create a Gia account to keep conversations and personal context across devices.';
    return {
      metadataBase: new URL('https://gia.purangpt.com'),
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: { title, description, type: 'website', url: '/register', images: [] },
      twitter: { card: 'summary', title, description, images: [] },
    };
  }

  return {
    title: 'Create your Mila account',
    description: 'Begin your Mila language-learning path.',
    robots: { index: false, follow: false },
  };
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
