import type { Metadata, Viewport } from 'next'
import { Manrope, Onest } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n-provider'
import { SceneProvider } from '@/lib/scene'
import Atmosphere from '@/components/Atmosphere'
import PwaRegister from '@/components/PwaRegister'
import MilaGuide from '@/components/MilaGuide'

const displayFont = Onest({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const sansFont = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mila — the English atelier',
  description: 'Английский как искусство: живые уроки, ИИ-наставница, произношение до фонемы. Private-club English for Russian speakers.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Mila', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon', apple: '/apple-icon' },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${displayFont.variable} ${sansFont.variable}`}>
      <body>
        <PwaRegister />
        <SceneProvider>
          <Atmosphere />
          <I18nProvider>
            <div className="animate-in">{children}</div>
            <MilaGuide />
          </I18nProvider>
        </SceneProvider>
      </body>
    </html>
  )
}
