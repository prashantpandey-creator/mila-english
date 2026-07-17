import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support — Mila',
  description: 'Help for the Mila English-learning app.',
}

export default function SupportPage() {
  return (
    <main style={{minHeight:'100vh',background:'#050506',color:'#fff4ee',fontFamily:'system-ui,-apple-system,sans-serif',padding:'52px 20px 80px'}}>
      <article style={{maxWidth:720,margin:'0 auto',lineHeight:1.7}}>
        <a href="/" style={{color:'#78e3f8',textDecoration:'none',fontWeight:800}}>← Mila</a>
        <p style={{margin:'34px 0 8px',color:'#ff7f9f',fontSize:12,fontWeight:900,letterSpacing:'0.15em'}}>SUPPORT · ПОДДЕРЖКА</p>
        <h1 style={{fontSize:'clamp(2.2rem,7vw,4.2rem)',lineHeight:1.02,margin:'0 0 18px'}}>We’ll help you keep learning.</h1>
        <p style={{fontSize:18,color:'#a6a4ad'}}>Tell us what happened, which device you use, and what you expected Mila to do.</p>

        <a href="mailto:fcpuru95@gmail.com?subject=Mila%20iOS%20Support" style={{display:'inline-block',margin:'22px 0 34px',padding:'13px 18px',borderRadius:999,background:'#78e3f8',color:'#050506',fontWeight:900,textDecoration:'none'}}>Email Mila support</a>

        <section style={{display:'grid',gap:14}}>
          {[
            ['The microphone does not start', 'Open iPhone Settings → Privacy & Security → Microphone and allow Mila. The app asks only when you start a recording.'],
            ['Mila cannot transcribe me', 'Check your connection, speak for at least one second, and try again in a quiet place. A technical failure is never scored as pronunciation.'],
            ['I want to delete my data', 'In the app, open Account and tap Delete account and data. Guest learners can choose Delete guest data.'],
            ['I am in Russia', 'Mila’s standard speech path uses its own private speech services. Availability still depends on reaching the Mila web origin from your network.'],
            ['Мне нужна помощь на русском', 'Напишите нам по электронной почте на русском языке. Укажите модель iPhone и опишите шаги до ошибки.'],
          ].map(([title,copy]) => (
            <div key={title} style={{padding:20,border:'1px solid rgba(255,255,255,.08)',borderRadius:18,background:'#121216'}}>
              <h2 style={{fontSize:18,margin:'0 0 7px'}}>{title}</h2>
              <p style={{margin:0,color:'#a6a4ad'}}>{copy}</p>
            </div>
          ))}
        </section>
      </article>
    </main>
  )
}
