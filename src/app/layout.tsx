import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n-provider'

export const metadata: Metadata = {
  title: 'EngFluent — Английский с душой',
  description: 'Уютная платформа для изучения английского. Сделано с любовью для русскоговорящих.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{fontFamily:"'Nunito','Inter',sans-serif"}}>
        <I18nProvider>
          <div className="animate-in">{children}</div>
        </I18nProvider>
      </body>
    </html>
  )
}
