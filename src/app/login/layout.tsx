import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { isGiaHostname } from '@/lib/productHosts';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  if (isGiaHostname(requestHeaders.get('host'))) {
    const title = 'Sign in to Gia';
    const description = 'Continue your Gia conversations, or enter as a private guest.';
    return {
      metadataBase: new URL('https://gia.purangpt.com'),
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: { title, description, type: 'website', url: '/login', images: [] },
      twitter: { card: 'summary', title, description, images: [] },
    };
  }

  return {
    title: 'Sign in to Mila English',
    description: 'Continue learning English with your native-language AI teacher.',
    robots: { index: false, follow: false },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
