import type { Metadata } from 'next'
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell'

export const metadata: Metadata = {
  title: 'Privacy Policy — Mila, Gia, and Mia',
  description: 'How Mila, Gia, and Mia handle account, learning, chat, and voice data.',
}

export default function PrivacyPage() {
  return (
    <AppShell className="legal-page privacy-page">
      <AppHeader backHref="/" title="Privacy policy" eyebrow="Mila · Gia · Mia" />
      <AppMain width="work" className="legal-page__main">
      <article className="legal-page__article">
        <p className="legal-page__kicker">PRIVACY POLICY</p>
        <h1>Your words are yours.</h1>
        <p className="legal-page__meta">Effective 24 July 2026 · Действует с 24 июля 2026 г.</p>

        <p style={{fontSize:18,marginTop:30}}>This policy covers the related services at <strong>mila.purangpt.com</strong> (structured language learning), <strong>gia.purangpt.com</strong> (the Gia text-and-voice companion), and <strong>mia.purangpt.com</strong> (the public travel, language, and culture experience), plus the Mila iOS app and legacy miachat.purangpt.com links. Together they are called the Services below.</p>
        <p>Mia’s public Scene Studio does not require an account and keeps its most recent scene in your browser. Gia and Mila have separate product experiences while using related account and service infrastructure behind the scenes.</p>

        <section>
          <h2>What the Services store</h2>
          <ul>
            <li><strong>Guest use:</strong> a random guest identifier and an internal placeholder email keep one person’s activity separate from another’s.</li>
            <li><strong>Optional account:</strong> name, email address, and a one-way password hash when you choose to register.</li>
            <li><strong>Learning data:</strong> level, lesson progress, answers, vocabulary reviews, pronunciation measurements, assessments, and study streaks.</li>
            <li><strong>Conversations:</strong> chat messages, voice transcripts, and only the facts you explicitly ask the active companion to remember.</li>
            <li><strong>Bug reports:</strong> the description and reply email you choose to provide, plus the current page, device/browser, screen size, language, and timezone. Chat history and audio are not attached.</li>
            <li><strong>Payments:</strong> provider payment ID, product, amount, currency, status, and access period. Mila does not receive or store full card details.</li>
          </ul>
        </section>

        <section>
          <h2>Voice data</h2>
          <p>Pronunciation tools and the private level-assessment path send a recording to Mila only after you tap the microphone. Mila’s speech service uses it to create a transcript, then deletes the recording after the request. The transcript and resulting learning feedback may remain in your learning history.</p>
          <p>The Mila level assessment offers a private Mila-server voice path, a written path with no microphone, and a separate optional <strong>Live conversation</strong>. Before Live conversation starts, the Service explains that microphone audio and its transcript will be sent to OpenAI for real-time processing and asks for explicit consent. Nothing is sent to OpenAI from that path unless you agree.</p>
          <p>Gia’s companion voice room currently offers only consented <strong>Live voice</strong> to eligible preview or Pro accounts; its unfinished private/local mode is unavailable. Before Live starts, Gia explains that microphone audio and the transcript will be sent to OpenAI for real-time processing and asks for explicit consent. If you do not agree, you can continue in text chat. Pia asks separately for each page session. Audio is never sent to advertising companies.</p>
          <p>Text chat may be processed by a configured AI model provider to generate a reply. The Services’ server brokers those requests; clients do not receive provider credentials.</p>
        </section>

        <section>
          <h2>Why data is used</h2>
          <p>The Services use this data only to operate: authenticate users, verify email and recover accounts, personalize lessons and conversations, measure learning progress, transcribe requested recordings, generate replies, process and reconcile a requested payment, prevent abuse, deliver requested bug reports to the owner, and diagnose technical failures.</p>
          <p>When direct bug-report delivery is enabled, the email delivery and mailbox providers process the report only to deliver and store that support email.</p>
        </section>

        <section>
          <h2>No advertising or tracking</h2>
          <p>The Services do not sell personal data, show behavioral advertising, or combine your activity with third-party data for advertising. The iOS app contains no advertising or cross-app tracking SDK.</p>
        </section>

        <section>
          <h2>Retention and deletion</h2>
          <p>Learning and account data is retained while your guest profile or account remains active. Mila’s <strong>Account</strong> page can delete the shared account and its learning data. Gia’s <strong>Account</strong> page can independently delete Gia conversation history and remembered facts without touching Mila learning data. These actions cannot be undone.</p>
          <p>When an account has a payment, Mila may retain a detached record of the payment ID, amount, currency, status, and access period where required for accounting, fraud prevention, refunds, or legal compliance. The local record no longer has a direct relation to the deleted Mila profile, but it can remain linkable through processor records where required. YooKassa and other service providers may retain data under their own legal obligations.</p>
        </section>

        <section>
          <h2>Security and contact</h2>
          <p>The Services use encrypted HTTPS connections and send speech and model requests through their server. Hosted checkout opens YooKassa directly so the Services never handle card credentials. Resend processes the email address only when verification or recovery mail is sent. No internet service can promise perfect security, so please do not submit passwords, banking details, or other secrets in chat.</p>
          <p>Questions or privacy requests: <a href="mailto:fcpuru95@gmail.com">fcpuru95@gmail.com</a>.</p>
        </section>

        <section className="legal-page__note">
          <h2>Коротко по-русски</h2>
          <p>Эта политика распространяется на Mila, Gia и Mia. Приватная запись на сервер Mila остаётся только в упражнениях на произношение и отдельной проверке уровня; аудио удаляется после запроса. Основная голосовая комната Gia сейчас предлагает только Live для доступного демо или Pro: аудио и текст передаются в OpenAI лишь после отдельного явного согласия. Незавершённый приватный/локальный режим основной комнаты временно недоступен; без согласия можно продолжить в текстовом чате. В отчёт об ошибке входят только введённое описание и технические данные, перечисленные выше; история чата и аудио не прикладываются. Сервисы не продают данные, не показывают рекламу и не используют межсайтовый трекинг. Учебные данные можно удалить на сайте или в приложении: <strong>Аккаунт → Удалить аккаунт и данные</strong>. Отдельная обезличенная запись об оплате может храниться для бухгалтерии и возвратов.</p>
        </section>
      </article>
      </AppMain>
    </AppShell>
  )
}
