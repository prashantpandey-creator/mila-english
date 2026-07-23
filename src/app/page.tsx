import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import MilaHomePageClient from './MilaHomePageClient'
import { isGiaHostname, isMiaHostname } from '@/lib/productHosts'

const MILA_TITLE = 'Mila — Learn languages for the life you want'
const MILA_DESCRIPTION = 'A focused multilingual learning app for lessons, real-world practice, pronunciation, vocabulary, and progress.'

export async function generateMetadata(): Promise<Metadata> {
  const hostname = (await headers()).get('host')

  if (isMiaHostname(hostname)) {
    const title = 'Mia — Meet the world in its own words'
    const description = 'A boho travel-and-language home for travelers, learners, and people curious about the cultures behind the words.'

    return {
      metadataBase: new URL('https://mia.purangpt.com'),
      title,
      description,
      appleWebApp: { capable: true, title: 'Mia', statusBarStyle: 'default' },
      alternates: { canonical: '/' },
      openGraph: {
        title,
        description,
        type: 'website',
        url: '/',
        images: [{ url: '/mia-og.png', width: 1200, height: 630, alt: title }],
      },
      twitter: { card: 'summary_large_image', title, description, images: ['/mia-og.png'] },
    }
  }

  if (isGiaHostname(hostname)) {
    const title = 'Gia — AI voice and text companion'
    const description = 'A playful multilingual AI companion for natural voice and text conversation.'

    return {
      metadataBase: new URL('https://gia.purangpt.com'),
      title,
      description,
      appleWebApp: { capable: true, title: 'Gia', statusBarStyle: 'black-translucent' },
      alternates: { canonical: '/' },
      openGraph: { title, description, type: 'website', url: '/' },
      twitter: { card: 'summary', title, description },
    }
  }

  return {
    metadataBase: new URL('https://mila.purangpt.com'),
    title: MILA_TITLE,
    description: MILA_DESCRIPTION,
    appleWebApp: { capable: true, title: 'Mila', statusBarStyle: 'default' },
    alternates: { canonical: '/' },
    openGraph: {
      title: MILA_TITLE,
      description: MILA_DESCRIPTION,
      type: 'website',
      url: '/',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: MILA_TITLE }],
    },
    twitter: {
      card: 'summary_large_image',
      title: MILA_TITLE,
      description: MILA_DESCRIPTION,
      images: ['/og.png'],
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const hostname = (await headers()).get('host')

  if (isGiaHostname(hostname)) {
    return {
      width: 'device-width',
      initialScale: 1,
      viewportFit: 'cover',
      themeColor: '#04070a',
      colorScheme: 'dark',
    }
  }

  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: isMiaHostname(hostname) ? '#f5efe4' : '#faf8f5',
    colorScheme: 'light',
  }
}

export default function HomePage() {
  return <MilaHomePageClient />
}
