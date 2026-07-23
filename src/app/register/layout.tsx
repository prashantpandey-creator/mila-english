import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { isGiaHostname } from '@/lib/productHosts';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  if (isGiaHostname(requestHeaders.get('host'))) {
    return {
      metadataBase: new URL('https://gia.purangpt.com'),
      title: 'Join Gia',
      description: 'Create an account to save your multilingual conversations, languages, and learning path.',
      robots: { index: false, follow: false },
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
