import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Manrope, Yeseva_One, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import './inner-theme.css'
import './gia-theme.css'
import { I18nProvider } from '@/lib/i18n-provider'
import { SceneProvider } from '@/lib/scene'
import Atmosphere from '@/components/Atmosphere'
import PwaRegister from '@/components/PwaRegister'
import MilaGuide from '@/components/MilaGuide'
import BottomNav from '@/components/BottomNav'
import RouteSurface from '@/components/RouteSurface'
import { ProductProvider } from '@/lib/product-context'
import { productForHostname } from '@/lib/productHosts'

const serifFont = Yeseva_One({
  weight: '400',
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
})

const sansFont = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
})

const monoFont = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const product = productForHostname((await headers()).get('host'))
  const common = {
    manifest: '/manifest.webmanifest',
    icons: { icon: '/icon', apple: '/apple-icon' },
  }

  if (product === 'mia') {
    const title = 'Mia — Meet the world in its own words'
    const description = 'Generate vivid travel-language scenes with useful phrases, likely replies, and thoughtful cultural context.'
    return {
      ...common,
      metadataBase: new URL('https://mia.purangpt.com'),
      title,
      description,
      appleWebApp: { capable: true, title: 'Mia', statusBarStyle: 'default' },
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

  if (product === 'gia') {
    const title = 'Gia — AI voice and text companion'
    const description = 'A warm, open-ended multilingual AI companion for natural voice and text conversation.'
    return {
      ...common,
      metadataBase: new URL('https://gia.purangpt.com'),
      title,
      description,
      appleWebApp: { capable: true, title: 'Gia', statusBarStyle: 'black-translucent' },
      openGraph: { title, description, type: 'website', url: '/', images: [] },
      twitter: { card: 'summary', title, description, images: [] },
    }
  }

  const title = 'Mila English — Learn English from the language you know'
  const description = 'India-first English learning with an AI teacher matched to your native language, plus speaking, pronunciation, vocabulary, and progress.'
  return {
    ...common,
    metadataBase: new URL('https://mila.purangpt.com'),
    title,
    description,
    appleWebApp: { capable: true, title: 'Mila English', statusBarStyle: 'default' },
    openGraph: {
      title,
      description,
      type: 'website',
      url: '/',
      images: [],
    },
    twitter: { card: 'summary', title, description, images: [] },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const product = productForHostname((await headers()).get('host'))
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: product === 'gia' ? '#04070a' : product === 'mia' ? '#f5efe4' : '#faf8f5',
    colorScheme: product === 'gia' ? 'dark' : 'light',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const product = productForHostname((await headers()).get('host'))
  const showMilaChrome = product === 'mila'

  return (
    <html
      lang="en"
      data-product={product}
      data-mila-theme={product === 'gia' ? 'dark' : 'light'}
      className={`${serifFont.variable} ${sansFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ProductProvider product={product}>
          <PwaRegister />
          <SceneProvider>
            {showMilaChrome ? <Atmosphere /> : null}
            <I18nProvider>
              <RouteSurface>
                <div className="animate-in">{children}</div>
                {showMilaChrome ? <MilaGuide /> : null}
                {showMilaChrome ? <BottomNav /> : null}
              </RouteSurface>
            </I18nProvider>
          </SceneProvider>
        </ProductProvider>
      </body>
    </html>
  )
}
