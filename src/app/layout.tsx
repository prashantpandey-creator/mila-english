import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n-provider'
import { SceneProvider } from '@/lib/scene'
import Atmosphere from '@/components/Atmosphere'

export const metadata: Metadata = {
  title: 'Mila — the English atelier',
  description: 'Английский как искусство: живые уроки, ИИ-наставница, произношение до фонемы. Private-club English for Russian speakers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{fontFamily:"'Manrope','Inter',sans-serif"}}>
        <SceneProvider>
          <Atmosphere />
          <I18nProvider>
            <div className="animate-in">{children}</div>
          </I18nProvider>
        </SceneProvider>
      </body>
    </html>
  )
}
