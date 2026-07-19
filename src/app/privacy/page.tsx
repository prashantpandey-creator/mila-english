import type { Metadata } from 'next'
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell'

export const metadata: Metadata = {
  title: 'Privacy Policy — Mila',
  description: 'How Mila handles account, learning, chat, and voice data.',
}

export default function PrivacyPage() {
  return (
    <AppShell className="legal-page privacy-page">
      <AppHeader backHref="/" title="Privacy policy" eyebrow="Mila · trust" />
      <AppMain width="work" className="legal-page__main">
      <article className="legal-page__article">
        <p className="legal-page__kicker">PRIVACY POLICY</p>
        <h1>Your learning is private.</h1>
        <p className="legal-page__meta">Effective 19 July 2026 · Действует с 19 июля 2026 г.</p>

        <p style={{fontSize:18,marginTop:30}}>Mila is an English-learning service for Russian-speaking learners. This policy covers the Mila iOS app and the web service at mila.purangpt.com.</p>

        <section>
          <h2>What Mila stores</h2>
          <ul>
            <li><strong>Guest use:</strong> a random guest identifier and an internal placeholder email keep one learner’s progress separate from another’s.</li>
            <li><strong>Optional account:</strong> name, email address, and a one-way password hash when you choose to register.</li>
            <li><strong>Learning data:</strong> level, lesson progress, answers, vocabulary reviews, pronunciation measurements, assessments, and study streaks.</li>
            <li><strong>Conversations:</strong> chat messages, voice transcripts, and only the facts you explicitly ask Mila to remember.</li>
            <li><strong>Bug reports:</strong> the description and reply email you choose to provide, plus the current page, device/browser, screen size, language, and timezone. Chat history and audio are not attached.</li>
            <li><strong>Payments:</strong> provider payment ID, product, amount, currency, status, and access period. Mila does not receive or store full card details.</li>
          </ul>
        </section>

        <section>
          <h2>Voice data</h2>
          <p>The app sends a recording to Mila only after you tap the microphone. Mila’s private speech service uses it to create a transcript, then deletes the recording after the request. In <strong>Private</strong> voice mode, microphone audio and its transcript are kept away from external model providers. The transcript and resulting learning feedback may remain in your learning history.</p>
          <p>The level assessment offers a private Mila-server voice path, a written path with no microphone, and a separate optional <strong>Live conversation</strong>. Before Live conversation starts, Mila explains that microphone audio and its transcript will be sent to OpenAI for real-time processing and asks for explicit consent. Nothing is sent to OpenAI from that path unless you agree.</p>
          <p>Eligible Pro learners can separately choose an external <strong>Fast live voice</strong>, including Pia’s optional live Hindi room. Before one starts, the product explains that microphone audio and the transcript will be sent to OpenAI for live processing and asks for explicit consent. Mila’s main voice choice is stored for that account and can be switched back to Private before a call; Pia asks separately for each page session. Audio is never sent to advertising companies.</p>
          <p>Text chat may be processed by a configured AI model provider to generate a reply. The Mila server brokers those requests; clients do not receive provider credentials.</p>
        </section>

        <section>
          <h2>Why data is used</h2>
          <p>Mila uses this data only to operate the service: authenticate learners, verify email and recover accounts, personalize lessons, measure learning progress, transcribe requested recordings, generate tutoring replies, process and reconcile a requested payment, prevent abuse, deliver requested bug reports to Mila’s owner, and diagnose technical failures.</p>
          <p>When direct bug-report delivery is enabled, Mila’s email delivery and mailbox providers process the report only to deliver and store that support email.</p>
        </section>

        <section>
          <h2>No advertising or tracking</h2>
          <p>Mila does not sell personal data, show behavioral advertising, or combine your activity with third-party data for advertising. The iOS app contains no advertising or cross-app tracking SDK.</p>
        </section>

        <section>
          <h2>Retention and deletion</h2>
          <p>Learning and account data is retained while your guest profile or account remains active. On the web or in the iOS app, open <strong>Account</strong> and choose <strong>Delete account and data</strong> or <strong>Delete guest data</strong>. Mila deletes the profile, progress, assessments, vocabulary reviews, companion history, and saved memories. This cannot be undone.</p>
          <p>When an account has a payment, Mila may retain a detached record of the payment ID, amount, currency, status, and access period where required for accounting, fraud prevention, refunds, or legal compliance. The local record no longer has a direct relation to the deleted Mila profile, but it can remain linkable through processor records where required. YooKassa and other service providers may retain data under their own legal obligations.</p>
        </section>

        <section>
          <h2>Security and contact</h2>
          <p>Mila uses encrypted HTTPS connections and sends speech and model requests through the Mila server. Hosted checkout opens YooKassa directly so Mila never handles card credentials. Resend processes the email address only when Mila sends verification or recovery mail. No internet service can promise perfect security, so please do not submit passwords, banking details, or other secrets in chat.</p>
          <p>Questions or privacy requests: <a href="mailto:fcpuru95@gmail.com">fcpuru95@gmail.com</a>.</p>
        </section>

        <section className="legal-page__note">
          <h2>Коротко по-русски</h2>
          <p>В приватном голосовом режиме аудиозапись обрабатывается на серверах Mila, удаляется после запроса и вместе с расшифровкой не отправляется внешнему AI-провайдеру. Необязательное живое собеседование для проверки уровня и быстрый голос Pro передают аудио и текст в OpenAI только после отдельного явного согласия. В отчёт об ошибке входят только введённое описание и технические данные, перечисленные выше; история чата и аудио не прикладываются. Mila не продаёт данные, не показывает рекламу и не использует межсайтовый трекинг. Учебные данные можно удалить на сайте или в приложении: <strong>Аккаунт → Удалить аккаунт и данные</strong>. Отдельная обезличенная запись об оплате может храниться для бухгалтерии и возвратов.</p>
        </section>
      </article>
      </AppMain>
    </AppShell>
  )
}
