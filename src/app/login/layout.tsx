import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { isMiaChatHostname } from '@/lib/productHosts';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  if (isMiaChatHostname(requestHeaders.get('host'))) {
    return {
      metadataBase: new URL('https://miachat.purangpt.com'),
      title: 'Sign in to MiaChat',
      description: 'Continue to MiaChat with your Mila account, or enter as a guest.',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: 'Sign in to Mila',
    description: 'Continue your Mila language-learning path.',
    robots: { index: false, follow: false },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
