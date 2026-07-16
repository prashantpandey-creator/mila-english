'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LangToggle from '@/components/LangToggle'
import MilaIcon from '@/components/ui/MilaIcon'
import { useI18n } from '@/lib/i18n-provider'
import { ACCENTS, startListening, type Assessment, type Session } from '@/lib/speech'
import { ttsSpeak } from '@/lib/tts'
import { C } from '@/lib/theme'

type Sound = {
  ipa: string
  word: string
  phrase: string
  titleRu: string
  titleEn: string
  mouthRu: string
  mouthEn: string
  airRu: string
  airEn: string
  voiceRu: string
  voiceEn: string
  tongue: 'teeth'|'back'|'low'|'ridge'
}

const SOUNDS: Sound[] = [
  { ipa:'/θ/', word:'think', phrase:'I think this is the right way.', titleRu:'Глухой TH', titleEn:'Unvoiced TH', mouthRu:'Кончик языка слегка между зубами.', mouthEn:'Rest the tongue tip lightly between the teeth.', airRu:'Мягко выдыхай воздух вперёд.', airEn:'Let a soft stream of air move forward.', voiceRu:'Голосовые связки не вибрируют.', voiceEn:'Keep your voice switched off.', tongue:'teeth' },
  { ipa:'/ð/', word:'this', phrase:'This weather is better.', titleRu:'Звонкий TH', titleEn:'Voiced TH', mouthRu:'Язык в той же позиции между зубами.', mouthEn:'Keep the same tongue-between-teeth position.', airRu:'Воздух идёт мягко и непрерывно.', airEn:'Keep the airflow gentle and continuous.', voiceRu:'Добавь вибрацию в горле.', voiceEn:'Add a gentle vibration in your throat.', tongue:'teeth' },
  { ipa:'/w/', word:'world', phrase:'We work well together.', titleRu:'Английский W', titleEn:'English W', mouthRu:'Округли губы, язык не касается зубов.', mouthEn:'Round the lips; keep the tongue away from the teeth.', airRu:'Быстро раскрой губы в следующий гласный.', airEn:'Release quickly into the next vowel.', voiceRu:'Звук звонкий и короткий.', voiceEn:'Use your voice and keep the sound short.', tongue:'back' },
  { ipa:'/r/', word:'river', phrase:'The red river runs around the road.', titleRu:'Английский R', titleEn:'English R', mouthRu:'Подними язык, но не касайся нёба.', mouthEn:'Lift the tongue without touching the roof of the mouth.', airRu:'Оставь узкий проход для воздуха.', airEn:'Leave a narrow path for the air.', voiceRu:'Не раскатывай звук, как русское «р».', voiceEn:'Keep it voiced without rolling or tapping.', tongue:'back' },
  { ipa:'/æ/', word:'cat', phrase:'That black cat is happy.', titleRu:'Широкий гласный Æ', titleEn:'Wide vowel Æ', mouthRu:'Опусти челюсть, язык лежит низко и впереди.', mouthEn:'Lower the jaw; keep the tongue low and forward.', airRu:'Рот остаётся широко открытым.', airEn:'Keep the mouth openly relaxed.', voiceRu:'Произнеси между русскими «а» и «э».', voiceEn:'Voice a vowel between a short a and e quality.', tongue:'low' },
  { ipa:'/ʃ/', word:'she', phrase:'She should show us the shop.', titleRu:'Мягкий SH', titleEn:'Soft SH', mouthRu:'Губы слегка округлены, язык поднят к нёбу.', mouthEn:'Round the lips slightly and lift the tongue.', airRu:'Направь воздух по центру языка.', airEn:'Send the air along the centre of the tongue.', voiceRu:'Голос выключен: слышно только воздух.', voiceEn:'Keep the voice off; hear only the air.', tongue:'ridge' },
  { ipa:'/dʒ/', word:'job', phrase:'Jane enjoys her new job.', titleRu:'Звук J', titleEn:'The J sound', mouthRu:'Начни с короткого смыкания у альвеол.', mouthEn:'Begin with a brief closure behind the upper teeth.', airRu:'Отпусти воздух через мягкий «ж»‑образный шум.', airEn:'Release into a soft zh-like friction.', voiceRu:'Голос работает на всём звуке.', voiceEn:'Keep the voice on throughout.', tongue:'ridge' },
  { ipa:'/ŋ/', word:'sing', phrase:'We are singing a long song.', titleRu:'Задний NG', titleEn:'Back NG', mouthRu:'Задняя часть языка касается мягкого нёба.', mouthEn:'Touch the soft palate with the back of the tongue.', airRu:'Воздух выходит через нос.', airEn:'Let the air leave through the nose.', voiceRu:'Не добавляй отдельный звук «г».', voiceEn:'Keep it voiced without adding a separate g.', tongue:'back' },
]

function recordingMessage(problem: unknown, lang: 'ru'|'en') {
  const error = problem instanceof Error ? problem : null
  const code = error?.message || ''
  const name = error?.name || ''
  if (name === 'NotAllowedError' || code === 'permission-denied') return lang==='ru' ? 'Доступ к микрофону закрыт. Разреши микрофон для Mila в настройках сайта и попробуй снова.' : 'Microphone access is blocked. Allow the microphone for Mila in site settings and try again.'
  if (name === 'NotFoundError' || code === 'no-microphone') return lang==='ru' ? 'Микрофон не найден. Подключи микрофон или выбери его в настройках браузера.' : 'No microphone was found. Connect or select one in browser settings.'
  if (name === 'NotReadableError' || code === 'microphone-busy') return lang==='ru' ? 'Микрофон занят другим приложением. Закрой звонок или диктофон и попробуй снова.' : 'Another app is using the microphone. Close the call or recorder and try again.'
  if (code === 'no-speech') return lang==='ru' ? 'Речь не записалась — это не оценка произношения. Нажми запись и начни говорить сразу.' : 'No speech was captured—this is not a pronunciation score. Start speaking just after tapping record.'
  if (code === 'score-failed' || code === 'score-empty') return lang==='ru' ? 'Сервис оценки временно недоступен. Запись не оценивалась; попробуй ещё раз.' : 'Scoring is temporarily unavailable. Your recording was not graded; please try again.'
  if (code === 'insecure-context') return lang==='ru' ? 'Микрофон работает только на защищённом HTTPS‑сайте Mila.' : 'Microphone recording requires Mila to be opened over secure HTTPS.'
  return lang==='ru' ? 'Не удалось начать запись. Проверь микрофон и разрешение сайта — менять браузер не обязательно.' : 'Recording could not start. Check the microphone and site permission—you do not need to change browsers.'
}

function MouthMap({ sound }: { sound: Sound }) {
  const tongue = sound.tongue === 'teeth' ? 'M42 69 Q68 47 108 61' : sound.tongue === 'low' ? 'M35 72 Q74 83 119 69' : sound.tongue === 'ridge' ? 'M39 72 Q71 48 111 55' : 'M42 72 Q82 60 115 45'
  return <svg role="img" aria-label={`Mouth position for ${sound.ipa}`} width="100%" height="150" viewBox="0 0 160 120" style={{display:'block'}}>
    <path d="M18 58 Q25 17 79 16 Q138 16 145 58 Q137 102 80 104 Q25 101 18 58Z" fill="rgba(255,255,255,.025)" stroke="rgba(255,255,255,.22)" strokeWidth="2"/>
    <path d="M27 54 Q78 36 136 53" fill="none" stroke="rgba(247,247,248,.66)" strokeWidth="5" strokeLinecap="round"/>
    <path d={tongue} fill="none" stroke={C.rose} strokeWidth="10" strokeLinecap="round"/>
    {sound.tongue === 'teeth' && <path d="M78 48 L80 69" stroke="#6adcf5" strokeWidth="5" strokeLinecap="round"/>}
    <path d="M80 75 C101 77 125 70 147 60" fill="none" stroke="#6adcf5" strokeWidth="2" strokeDasharray="4 5"/>
    <circle cx="149" cy="59" r="3" fill="#6adcf5"/>
  </svg>
}

export default function PronunciationLab() {
  const { lang } = useI18n()
  const router = useRouter()
  const [active, setActive] = useState(0)
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<'idle'|'recording'|'scoring'|'scored'|'error'>('idle')
  const [result, setResult] = useState<Assessment|null>(null)
  const [message, setMessage] = useState('')
  const [playing, setPlaying] = useState(false)
  const sessionRef = useRef<Session|null>(null)
  const sound = SOUNDS[active]
  const filtered = SOUNDS.map((item,index)=>({item,index})).filter(({item})=>`${item.ipa} ${item.word} ${item.titleEn} ${item.titleRu}`.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(()=>()=>{ sessionRef.current?.cancel(); sessionRef.current=null },[])

  const chooseSound = (index: number) => {
    sessionRef.current?.cancel(); sessionRef.current=null
    setActive(index); setResult(null); setMessage(''); setPhase('idle')
  }
  const search = (value: string) => {
    setQuery(value)
    const normalized=value.trim().toLowerCase()
    if (!normalized) return
    const match=SOUNDS.findIndex(item=>`${item.ipa} ${item.word} ${item.titleEn} ${item.titleRu}`.toLowerCase().includes(normalized))
    if (match>=0 && match!==active) chooseSound(match)
  }
  const listen = async () => {
    if (playing) return
    setPlaying(true)
    try { await ttsSpeak(sound.phrase,'en-GB',.78) } finally { setPlaying(false) }
  }
  const settle = (assessment: Assessment) => { sessionRef.current=null; setResult(assessment); setPhase('scored') }
  const fail = (problem: unknown) => { sessionRef.current=null; setMessage(recordingMessage(problem,lang)); setPhase('error') }
  const record = async () => {
    if (phase==='recording' && sessionRef.current) {
      setPhase('scoring')
      try { settle(await sessionRef.current.stop()) } catch (problem) { fail(problem) }
      return
    }
    setResult(null); setMessage(''); setPhase('recording')
    try {
      sessionRef.current=await startListening(sound.phrase,ACCENTS[0],settle,()=>setPhase('scoring'),fail)
    } catch (problem) { fail(problem) }
  }

  return <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"var(--font-sans,'Manrope'),sans-serif"}}>
    <header style={{position:'sticky',top:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 20px',background:C.navBg,borderBottom:`1px solid ${C.line}`,backdropFilter:'blur(14px)'}}>
      <button type="button" onClick={()=>router.push('/dashboard')} style={{border:0,background:'transparent',color:C.dark,cursor:'pointer',display:'flex',alignItems:'center',gap:9,padding:0,fontWeight:750,fontSize:'1.05rem'}}><span style={{color:C.gold}}>←</span> Mila</button>
      <LangToggle/>
    </header>
    <main style={{width:'min(760px,100%)',margin:'0 auto',padding:'28px 18px 56px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}><span style={{width:44,height:44,borderRadius:14,display:'grid',placeItems:'center',color:C.gold,background:C.goldL,border:'1px solid rgba(106,220,245,.25)'}}><MilaIcon name="pronunciation" size={23}/></span><div><div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:1.4,textTransform:'uppercase',color:C.gold}}>{lang==='ru'?'Лаборатория звуков':'Sound laboratory'}</div><h1 style={{fontSize:'clamp(1.65rem,5vw,2.25rem)',margin:2,color:C.dark}}>{lang==='ru'?'Произношение без догадок':'Pronunciation without guesswork'}</h1></div></div>
      <p style={{color:C.warm,lineHeight:1.6,margin:'12px 0 22px',maxWidth:620}}>{lang==='ru'?'Выбери сложный звук, посмотри положение языка, послушай фразу и получи мягкую оценку своей записи.':'Choose a difficult sound, see the tongue position, hear a phrase, and get gentle feedback on your recording.'}</p>

      <label style={{display:'block',marginBottom:16}}><span style={{display:'block',fontSize:'.76rem',fontWeight:750,color:C.warm,marginBottom:7}}>{lang==='ru'?'Найти звук или слово':'Find a sound or word'}</span><input value={query} onChange={event=>search(event.target.value)} placeholder={lang==='ru'?'Например: th, world, /æ/':'For example: th, world, /æ/'} style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',borderRadius:13,border:`1px solid ${C.line}`,background:'rgba(8,8,9,.78)',color:C.dark,outline:'none',fontSize:'.95rem'}}/></label>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:9,marginBottom:18}}>
        {filtered.map(({item,index})=><button type="button" key={item.ipa} onClick={()=>chooseSound(index)} aria-pressed={active===index} style={{padding:'12px 8px',borderRadius:14,border:active===index?'1.5px solid #6adcf5':`1px solid ${C.line}`,background:active===index?C.goldL:'rgba(8,8,9,.78)',color:C.dark,cursor:'pointer',textAlign:'center'}}><span style={{display:'block',fontSize:'1.22rem',fontWeight:800,color:active===index?C.gold:C.dark}}>{item.ipa}</span><span style={{display:'block',fontSize:'.75rem',color:C.warm,marginTop:3}}>{item.word}</span></button>)}
      </div>
      {!filtered.length && <div style={{padding:16,borderRadius:14,background:'rgba(8,8,9,.78)',color:C.warm,marginBottom:18}}>{lang==='ru'?'Такого звука пока нет. Попробуй слово из списка.':'That sound is not in the lab yet. Try one of the listed words.'}</div>}

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(280px,100%),1fr))',gap:12,marginBottom:14}}>
        <div style={{padding:'20px',borderRadius:18,border:`1px solid ${C.line}`,background:'rgba(8,8,9,.86)',boxShadow:'0 8px 28px rgba(0,0,0,.32)'}}>
          <div style={{display:'flex',alignItems:'baseline',gap:10}}><strong style={{fontSize:'2rem',color:C.rose}}>{sound.ipa}</strong><span style={{fontSize:'1.05rem',fontWeight:750,color:C.dark}}>{lang==='ru'?sound.titleRu:sound.titleEn}</span></div>
          <MouthMap sound={sound}/>
          {[{n:'1',ru:sound.mouthRu,en:sound.mouthEn},{n:'2',ru:sound.airRu,en:sound.airEn},{n:'3',ru:sound.voiceRu,en:sound.voiceEn}].map(step=><div key={step.n} style={{display:'grid',gridTemplateColumns:'26px 1fr',gap:9,alignItems:'start',marginTop:9,color:C.warm,fontSize:'.86rem',lineHeight:1.45}}><span style={{width:24,height:24,borderRadius:8,display:'grid',placeItems:'center',background:C.goldL,color:C.gold,fontWeight:800,fontSize:'.72rem'}}>{step.n}</span><span>{lang==='ru'?step.ru:step.en}</span></div>)}
        </div>
        <div style={{padding:'20px',borderRadius:18,border:`1px solid ${C.line}`,background:'rgba(8,8,9,.86)',boxShadow:'0 8px 28px rgba(0,0,0,.32)'}}>
          <div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:1.2,textTransform:'uppercase',color:C.gold}}>{lang==='ru'?'Фраза для практики':'Practice phrase'}</div>
          <div style={{fontSize:'1.3rem',lineHeight:1.4,fontWeight:750,color:C.dark,margin:'14px 0 5px'}}>{sound.phrase}</div><div style={{fontSize:'.82rem',color:C.warm}}>{lang==='ru'?`Фокус: ${sound.ipa} в слове “${sound.word}”`:`Focus: ${sound.ipa} in “${sound.word}”`}</div>
          <button type="button" onClick={listen} disabled={playing||phase==='recording'||phase==='scoring'} style={{width:'100%',marginTop:16,padding:12,borderRadius:12,border:0,background:C.roseL,color:C.rose,fontWeight:750,cursor:'pointer'}}><MilaIcon name="volume" size={17} style={{display:'inline-block',verticalAlign:'middle',marginRight:7}}/>{playing?(lang==='ru'?'Звучит…':'Playing…'):(lang==='ru'?'Послушать фразу':'Hear the phrase')}</button>
          {result && <div style={{marginTop:14,padding:14,borderRadius:13,background:C.sageL,border:'1px solid rgba(117,223,180,.24)'}}><div style={{display:'flex',alignItems:'center',gap:10}}><strong style={{fontSize:'1.5rem',color:C.sage}}>{result.score}</strong><span style={{fontWeight:750,color:C.dark}}>{result.score>=80?(lang==='ru'?'Ясно и уверенно':'Clear and confident'):result.score>=55?(lang==='ru'?'Хорошая основа':'A good foundation'):(lang==='ru'?'Полезная отправная точка':'A useful starting point')}</span></div><p style={{fontSize:'.82rem',lineHeight:1.45,color:C.warm,margin:'8px 0 0'}}>🌱 {result.tip}</p></div>}
          {message && <div role="alert" style={{marginTop:14,padding:12,borderRadius:12,background:C.roseL,color:C.rose,fontSize:'.84rem',lineHeight:1.45}}>{message}</div>}
          <button type="button" onClick={record} disabled={phase==='scoring'} style={{width:'100%',marginTop:14,padding:14,borderRadius:13,border:0,background:phase==='recording'?C.gold:C.rose,color:phase==='recording'?'#031a20':'white',fontWeight:800,cursor:phase==='scoring'?'default':'pointer'}}>{phase==='recording'?'■ '+(lang==='ru'?'Закончить запись':'Stop recording'):phase==='scoring'?'… '+(lang==='ru'?'Оцениваю':'Scoring'):'● '+(result?(lang==='ru'?'Записать ещё раз':'Record again'):(lang==='ru'?'Записать себя':'Record yourself'))}</button>
        </div>
      </section>
      <button type="button" onClick={()=>router.push('/listen')} style={{width:'100%',padding:14,borderRadius:14,border:`1px solid ${C.line}`,background:'rgba(8,8,9,.62)',color:C.dark,fontWeight:750,cursor:'pointer'}}>{lang==='ru'?'Перейти к фразам и акцентам →':'Continue to phrases and accents →'}</button>
    </main>
  </div>
}
