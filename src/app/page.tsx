// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import SpeechButton from '@/components/SpeechButton';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

export default function HomePage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [m, setM] = useState(false);
  useEffect(()=>{setM(true)},[]);
  if (!m) return null;

  const CATEGORIES = [
    { id:'beginners', emoji:'🌱', title:lang==='ru'?'Абсолютные Новички':'Absolute Beginners',
      sub:lang==='ru'?'С нуля — полная когнитивная перегрузка. Страх говорить, путаница с произношением, слова забываются за дни.'
         :'Starting from zero — complete cognitive overload. Fear of speaking, pronunciation chaos, words vanish within days.',
      points:lang==='ru'
        ?['Фонетика против правописания — knife, doubt, though','Путаница порядка слов — английский строго SVO','Страх ошибок парализует устную практику','Слова забываются без немедленного применения']
        :['Phonetics vs spelling — knife, doubt, though','Word order confusion — English is strictly SVO','Fear of mistakes paralyzes speaking','Words forgotten without immediate use'] },
    { id:'young', emoji:'🎨', title:lang==='ru'?'Дети':'Young Learners',
      sub:lang==='ru'?'Дети учатся через игру — структура убивает их любопытство. Короткое внимание, отсутствие мотивации, абстрактные понятия.'
         :'Children learn through play — structure kills curiosity. Short attention, no motivation, abstract concepts.',
      points:lang==='ru'
        ?['Внимание теряется за минуты — никаких лекций','Мотивация только через игру и истории','Термины вроде "причастие" ничего не значат','Смешивают правила языков, изобретают слова']
        :['Focus lost within minutes — no lectures','Motivation only through games and stories','Terms like "participle" mean nothing','Mix language rules, invent words'] },
    { id:'adults', emoji:'💼', title:lang==='ru'?'Взрослые Новички':'Adult Beginners',
      sub:lang==='ru'?'Сильная логика, тяжёлый багаж — слишком много думают, прежде чем заговорить. Завышенные ожидания, нехватка времени.'
         :'Strong logic, heavy baggage — overthink before speaking. High expectations, no time.',
      points:lang==='ru'
        ?['Сверханализ грамматики замедляет беглость','Речевые мышцы привыкли к родному языку','Ожидание быстрых результатов → разочарование','Работа, семья — нет режима → бросают']
        :['Overthinking grammar slows fluency','Speech muscles stuck in native language','Expect fast results → frustration','Work, family — no routine → drop out'] },
    { id:'intermediate', emoji:'🚀', title:lang==='ru'?'Преодоление Плато':'Intermediate Plateau',
      sub:lang==='ru'?'Достаточно хорошо, чтобы общаться — достаточно застрял, чтобы остаться. Пассивный vs активный словарь, слитная речь.'
         :'Good enough to communicate — stuck enough to stay. Passive vs active vocabulary, connected speech.',
      points:lang==='ru'
        ?['Ловушка "достаточно хорошо" — перестают расти','Понимают слова, но не используют их в речи','Условные предложения, модальные глаголы, фразовые глаголы','Слитная речь носителей — слова сливаются']
        :['"Good enough" trap — stop pushing','Understand words but don\'t use them','Conditionals, modal verbs, phrasal verbs','Native connected speech — words blur together'] },
  ];

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Nunito','Inter',sans-serif"}}>

      {/* ── NAV ── */}
      <div style={{background:C.navBg,backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(0,0,0,0.04)',position:'sticky',top:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontWeight:800,fontSize:'1.2rem',color:C.dark}}>🌸 Мила</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <LangToggle />
          <button onClick={()=>router.push('/login')}
            style={{padding:'8px 20px',borderRadius:20,border:'none',background:C.rose,color:'white',
              fontWeight:600,fontSize:'0.9rem',cursor:'pointer'}}>
            {lang==='ru'?'Войти':'Sign In'}
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{maxWidth:600,margin:'0 auto',padding:'40px 20px 0',textAlign:'center'}}>
        <div style={{fontSize:'3.5rem',marginBottom:12}}>🌸</div>
        <h1 style={{fontSize:'2rem',fontWeight:800,color:C.dark,lineHeight:1.3,margin:0}}>
          {lang==='ru'?'Английский с душой':'English with soul'}
        </h1>
        <p style={{fontSize:'1.1rem',color:C.warm,margin:'10px 0 0',lineHeight:1.5}}>
          {lang==='ru'
            ?'Мила — это уютная платформа для изучения английского, созданная специально для русскоговорящих. Мы знаем, с какими трудностями ты сталкиваешься, и бережно проведём тебя через них.'
            :'Mila is a cozy English learning platform built specifically for Russian speakers. We know exactly what you struggle with — and we\'ll guide you through it, gently.'}
        </p>

        <div style={{marginTop:20}}>
          <SpeechButton text="Mila is a cozy English learning platform." label={lang==='ru'?'Послушать на английском':'Hear it in English'} />
        </div>

        {/* CTA Buttons */}
        <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:24,flexWrap:'wrap'}}>
          <button onClick={()=>router.push('/register')}
            style={{padding:'14px 32px',borderRadius:16,border:'none',
              background:`linear-gradient(135deg,${C.rose},#c2185b)`,color:'white',
              fontWeight:700,fontSize:'1.05rem',cursor:'pointer',
              boxShadow:'0 4px 18px rgba(233,30,99,0.3)'}}>
            {lang==='ru'?'Начать учиться →':'Start learning →'}
          </button>
          <button onClick={()=>document.getElementById('research')?.scrollIntoView({behavior:'smooth'})}
            style={{padding:'14px 32px',borderRadius:16,border:`2px solid ${C.rose}`,background:'transparent',
              color:C.rose,fontWeight:600,fontSize:'1.05rem',cursor:'pointer'}}>
            {lang==='ru'?'Как это работает':'How it works'}
          </button>
        </div>

        {/* Stats */}
        <div style={{display:'flex',justifyContent:'center',gap:32,marginTop:32,flexWrap:'wrap'}}>
          {[{n:'4',l:lang==='ru'?'Профиля учащихся':'Learner profiles'},
            {n:'17',l:lang==='ru'?'Проблем решено':'Pain points mapped'},
            {n:'100+',l:lang==='ru'?'Учеников исследовано':'Learners researched'}].map((s,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontSize:'1.8rem',fontWeight:800,color:C.rose}}>{s.n}</div>
              <div style={{fontSize:'0.8rem',color:C.warm}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RESEARCH SECTION ── */}
      <div id="research" style={{maxWidth:700,margin:'0 auto',padding:'60px 20px'}}>
        <h2 style={{textAlign:'center',fontSize:'1.5rem',fontWeight:800,color:C.dark,marginBottom:8}}>
          {lang==='ru'?'Почему большинство застревает':'Why most learners stay stuck'}
        </h2>
        <p style={{textAlign:'center',color:C.warm,marginBottom:32,fontSize:'0.95rem'}}>
          {lang==='ru'?'Мы опросили более 100 изучающих английский. У каждой группы — свои стены. Вот что мы нашли.'
            :'We talked to 100+ English learners. Each group hits the same walls. Here\'s what we found.'}
        </p>

        {CATEGORIES.map((cat,i)=>(
          <div key={cat.id} id={cat.id} style={{background:C.white,borderRadius:20,padding:'24px',
            boxShadow:'0 2px 16px rgba(0,0,0,0.04)',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <span style={{fontSize:'1.8rem'}}>{cat.emoji}</span>
              <div>
                <div style={{fontWeight:700,fontSize:'1.1rem',color:C.dark}}>{cat.title}</div>
                <div style={{fontSize:'0.85rem',color:C.warm}}>{cat.sub}</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {cat.points.map((p,j)=>(
                <div key={j} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 12px',
                  background:C.roseL,borderRadius:10,fontSize:'0.85rem',color:C.dark,lineHeight:1.4}}>
                  <span style={{color:C.rose,flexShrink:0}}>•</span> {p}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── METHOD ── */}
      <div style={{maxWidth:600,margin:'0 auto',padding:'0 20px 60px',textAlign:'center'}}>
        <h2 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark}}>
          {lang==='ru'?'Метод Милы':'The Mila Method'}
        </h2>
        <p style={{color:C.warm,fontSize:'0.95rem',marginBottom:24}}>
          {lang==='ru'?'Каждый путь уникален. Мы не учим всех одинаково.'
            :'Every path is unique. We don\'t teach everyone the same way.'}
        </p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[
            {e:'🎯',t:lang==='ru'?'Определи свой уровень':'Find your level',s:lang==='ru'?'Быстрый тест':'Quick assessment'},
            {e:'📚',t:lang==='ru'?'Учись в своём темпе':'Learn at your pace',s:lang==='ru'?'Короткие уроки':'Bite-sized lessons'},
            {e:'🎤',t:lang==='ru'?'Говори с ИИ':'Speak with AI',s:lang==='ru'?'Обратная связь':'Instant feedback'},
            {e:'🌸',t:lang==='ru'?'Уютная среда':'Cozy environment',s:lang==='ru'?'Без стресса':'Zero pressure'},
          ].map((f,i)=>(
            <div key={i} style={{background:C.white,borderRadius:16,padding:16,boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
              <div style={{fontSize:'1.8rem',marginBottom:6}}>{f.e}</div>
              <div style={{fontWeight:700,fontSize:'0.95rem',color:C.dark}}>{f.t}</div>
              <div style={{fontSize:'0.8rem',color:C.warm}}>{f.s}</div>
            </div>
          ))}
        </div>

        <button onClick={()=>router.push('/register')}
          style={{marginTop:28,padding:'16px 40px',borderRadius:16,border:'none',
            background:`linear-gradient(135deg,${C.sage},#388e3c)`,color:'white',
            fontWeight:700,fontSize:'1.1rem',cursor:'pointer',
            boxShadow:'0 4px 18px rgba(91,140,90,0.3)'}}>
          {lang==='ru'?'Начать бесплатно 🌸':'Start free 🌸'}
        </button>
      </div>

      {/* ── FOOTER ── */}
      <div style={{textAlign:'center',padding:'24px',color:C.warm,fontSize:'0.85rem',borderTop:'1px solid rgba(0,0,0,0.04)'}}>
        🌸 Мила — {lang==='ru'?'сделано с любовью для тех, кто учит английский':'made with love for English learners'}
      </div>
    </div>
  );
}
