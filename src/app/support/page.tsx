import type { Metadata } from 'next'
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell'

export const metadata: Metadata = {
  title: 'Support — Mila',
  description: 'Help for the Mila English-learning app.',
}

export default function SupportPage() {
  return (
    <AppShell className="legal-page support-page">
      <AppHeader backHref="/" title="Support" eyebrow="Mila · help" />
      <AppMain width="work" className="legal-page__main">
      <article className="legal-page__article">
        <p className="legal-page__kicker">SUPPORT · ПОДДЕРЖКА</p>
        <h1>We’ll help you keep learning.</h1>
        <p className="legal-page__lede">Tell us what happened, which device you use, and what you expected Mila to do.</p>

        <a className="legal-page__button" href="mailto:fcpuru95@gmail.com?subject=Mila%20iOS%20Support">Email Mila support</a>

        <section className="legal-page__cards">
          {[
            ['The microphone does not start', 'Open iPhone Settings → Privacy & Security → Microphone and allow Mila. The app asks only when you start a recording.'],
            ['Mila cannot transcribe me', 'Check your connection, speak for at least one second, and try again in a quiet place. A technical failure is never scored as pronunciation.'],
            ['I want to delete my data', 'In the app, open Account and tap Delete account and data. Guest learners can choose Delete guest data.'],
            ['I am in Russia', 'Mila’s standard speech path uses its own private speech services. Availability still depends on reaching the Mila web origin from your network.'],
            ['Мне нужна помощь на русском', 'Напишите нам по электронной почте на русском языке. Укажите модель iPhone и опишите шаги до ошибки.'],
          ].map(([title,copy]) => (
            <div className="legal-page__card" key={title}>
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
          ))}
        </section>
      </article>
      </AppMain>
    </AppShell>
  )
}
