import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Mila',
  description: 'How Mila handles account, learning, chat, and voice data.',
}

const section = { marginTop: 32 }

export default function PrivacyPage() {
  return (
    <main style={{minHeight:'100vh',background:'#050506',color:'#fff4ee',fontFamily:'system-ui,-apple-system,sans-serif',padding:'52px 20px 80px'}}>
      <article style={{maxWidth:760,margin:'0 auto',lineHeight:1.72}}>
        <a href="/" style={{color:'#78e3f8',textDecoration:'none',fontWeight:800}}>← Mila</a>
        <p style={{margin:'34px 0 8px',color:'#78e3f8',fontSize:12,fontWeight:900,letterSpacing:'0.15em'}}>PRIVACY POLICY</p>
        <h1 style={{fontSize:'clamp(2.2rem,7vw,4.2rem)',lineHeight:1.02,margin:'0 0 16px'}}>Your learning is private.</h1>
        <p style={{color:'#a6a4ad'}}>Effective 17 July 2026 · Действует с 17 июля 2026 г.</p>

        <p style={{fontSize:18,marginTop:30}}>Mila is an English-learning service for Russian-speaking learners. This policy covers the Mila iOS app and the web service at mila.purangpt.com.</p>

        <section style={section}>
          <h2>What Mila stores</h2>
          <ul>
            <li><strong>Guest use:</strong> a random guest identifier and an internal placeholder email keep one learner’s progress separate from another’s.</li>
            <li><strong>Optional account:</strong> name, email address, and a one-way password hash when you choose to register.</li>
            <li><strong>Learning data:</strong> level, lesson progress, answers, vocabulary reviews, pronunciation measurements, assessments, and study streaks.</li>
            <li><strong>Conversations:</strong> chat messages, voice transcripts, and only the facts you explicitly ask Mila to remember.</li>
          </ul>
        </section>

        <section style={section}>
          <h2>Voice data</h2>
          <p>The app sends a recording to Mila only after you tap the microphone. Mila’s private speech service uses it to create a transcript, then deletes the recording after the request. The transcript and resulting learning feedback may remain in your learning history.</p>
          <p>The audio recording is not sent to advertising companies. Depending on the region and the server configuration, the transcript—not the audio—may be processed by an enabled AI model provider to generate Mila’s reply. The local Mila model remains the provider-independent path.</p>
        </section>

        <section style={section}>
          <h2>Why data is used</h2>
          <p>Mila uses this data only to operate the service: authenticate learners, personalize lessons, measure learning progress, transcribe requested recordings, generate tutoring replies, prevent abuse, and diagnose technical failures.</p>
        </section>

        <section style={section}>
          <h2>No advertising or tracking</h2>
          <p>Mila does not sell personal data, show behavioral advertising, or combine your activity with third-party data for advertising. The iOS app contains no advertising or cross-app tracking SDK.</p>
        </section>

        <section style={section}>
          <h2>Retention and deletion</h2>
          <p>Learning and account data is retained while your guest profile or account remains active. In the iOS app, open <strong>Account</strong> and choose <strong>Delete account and data</strong> or <strong>Delete guest data</strong>. Mila deletes the profile, progress, assessments, vocabulary reviews, companion history, and saved memories, then starts a fresh private guest session. This cannot be undone.</p>
        </section>

        <section style={section}>
          <h2>Security and contact</h2>
          <p>Mila uses encrypted HTTPS connections and sends speech and model requests through the Mila server; the iOS app never contacts a model provider directly. No internet service can promise perfect security, so please do not submit passwords, banking details, or other secrets in chat.</p>
          <p>Questions or privacy requests: <a href="mailto:fcpuru95@gmail.com" style={{color:'#78e3f8'}}>fcpuru95@gmail.com</a>.</p>
        </section>

        <section style={{...section,padding:22,border:'1px solid rgba(120,227,248,.22)',borderRadius:18,background:'#121216'}}>
          <h2 style={{marginTop:0}}>Коротко по-русски</h2>
          <p>Аудиозапись используется только для расшифровки и удаляется после запроса. Текст, прогресс и история обучения сохраняются в профиле. Mila не продаёт данные, не показывает рекламу и не использует межсайтовый трекинг. Все данные можно удалить в приложении: <strong>Аккаунт → Удалить аккаунт и данные</strong>.</p>
        </section>
      </article>
    </main>
  )
}
