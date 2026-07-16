import type { Metadata, Viewport } from 'next'
import { Manrope, Onest } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n-provider'
import { SceneProvider } from '@/lib/scene'
import Atmosphere from '@/components/Atmosphere'
import PwaRegister from '@/components/PwaRegister'
import MilaGuide from '@/components/MilaGuide'
import RouteSurface from '@/components/RouteSurface'

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
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fff9fb',
}

// Runs before first paint so a night visitor never sees a blush flash: the
// welcome room's light CSS is gated on html[data-mila-theme]. Preference key
// mirrors mila_lang; absent/invalid means follow the device.
const themeInitScript = `(function(){try{var p=localStorage.getItem('mila_theme');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.milaTheme=d?'dark':'light';}catch(e){document.documentElement.dataset.milaTheme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${displayFont.variable} ${sansFont.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <PwaRegister />
        <SceneProvider>
          <Atmosphere />
          <I18nProvider>
            <RouteSurface>
              <div className="animate-in">{children}</div>
              <MilaGuide />
            </RouteSurface>
          </I18nProvider>
        </SceneProvider>
      </body>
    </html>
  )
}
