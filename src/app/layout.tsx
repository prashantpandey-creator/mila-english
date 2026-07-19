import type { Metadata, Viewport } from 'next'
import { Manrope, Yeseva_One, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import './inner-theme.css'
import { I18nProvider } from '@/lib/i18n-provider'
import { SceneProvider } from '@/lib/scene'
import Atmosphere from '@/components/Atmosphere'
import PwaRegister from '@/components/PwaRegister'
import MilaGuide from '@/components/MilaGuide'
import BottomNav from '@/components/BottomNav'
import RouteSurface from '@/components/RouteSurface'

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

export const metadata: Metadata = {
  title: 'Mila — the English atelier',
  description: 'Английский как искусство: живые уроки, ИИ-наставница, произношение до фонемы. Private-club English for Russian speakers.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Mila', statusBarStyle: 'default' },
  icons: { icon: '/icon', apple: '/apple-icon' },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#faf8f5', colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-mila-theme="light" className={`${serifFont.variable} ${sansFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <body>
        <PwaRegister />
        <SceneProvider>
          <Atmosphere />
          <I18nProvider>
            <RouteSurface>
              <div className="animate-in">{children}</div>
              <MilaGuide />
              <BottomNav />
            </RouteSurface>
          </I18nProvider>
        </SceneProvider>
      </body>
    </html>
  )
}
