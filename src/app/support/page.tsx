import type { Metadata } from 'next'
import BugReportForm from '@/components/BugReportForm'
import LangToggle from '@/components/LangToggle'
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell'

export const metadata: Metadata = {
  title: 'Support — Mila',
  description: 'Help for the Mila English-learning app.',
}

export default function SupportPage() {
  return (
    <AppShell className="legal-page support-page">
      <AppHeader backHref="/" title="Support" eyebrow="Mila · help" actions={<LangToggle />} />
      <AppMain width="work" className="legal-page__main">
      <article className="legal-page__article">
        <p className="legal-page__kicker">SUPPORT · ПОДДЕРЖКА</p>
        <h1>We’ll help you keep learning.</h1>
        <p className="legal-page__lede">Report a problem inside Mila and the owner will receive it by email, with useful device details attached automatically.</p>

        <BugReportForm />

        <p className="legal-page__lede">For sign-in, payment, refund, or privacy questions, contact Mila directly.</p>
        <a className="legal-page__button" href="mailto:fcpuru95@gmail.com?subject=Mila%20Support">Email Mila support</a>

        <section className="legal-page__cards">
          {[
            ['The microphone does not start', 'Open iPhone Settings → Privacy & Security → Microphone and allow Mila. The app asks only when you start a recording.'],
            ['Mila cannot transcribe me', 'Check your connection, speak for at least one second, and try again in a quiet place. A technical failure is never scored as pronunciation.'],
            ['I want to delete my data', 'On the web or in the app, open Account and choose Delete account and data. Guest learners can choose Delete guest data.'],
            ['I cannot sign in', 'Use Forgot password on the sign-in page. The private link expires after 30 minutes and signs out older sessions when you choose a new password.'],
            ['My email is not verified', 'Open Account and choose Send verification email. Check spam if it does not arrive; the private link expires after 24 hours.'],
            ['I paid but Pro is not active', 'Open Account after a few minutes. Mila activates Pro only after YooKassa confirms the payment. If it is still missing, email the account address, payment date, and amount—never send card details.'],
            ['I need a refund or was charged twice', 'Read Payments and refunds, then email support with the account email and payment date. Mila will verify the provider record and restore access or arrange the appropriate refund.'],
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
