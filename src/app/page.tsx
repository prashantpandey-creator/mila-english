// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

const GOLD_GRAD = 'linear-gradient(135deg,#e8b96a,#d4af37)';

export default function HomePage() {
  const { lang } = useI18n();
  const router = useRouter();
  const [m, setM] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setM(true);
    if (typeof document !== 'undefined') setIsLoggedIn(document.cookie.includes('token='));
  }, []);

  const guest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      if (!res.ok) throw new Error('');
      router.push('/dashboard'); router.refresh();
    } catch {
      alert(lang==='ru'?'Что-то пошло не так. Попробуйте ещё раз.':'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  if (!m) return null;

  const goldBtn = {
    padding:'15px 34px',borderRadius:14,border:'none',background:GOLD_GRAD,color:'#17130a',
    fontWeight:800,fontSize:'1rem',cursor:'pointer',letterSpacing:'0.02em',
    boxShadow:'0 8px 30px rgba(212,175,55,0.35)',
  };
  const ghostBtn = {
    padding:'15px 34px',borderRadius:14,border:'1px solid rgba(212,175,55,0.5)',background:'rgba(212,175,55,0.08)',
    color:'#e8cd7a',fontWeight:700,fontSize:'1rem',cursor:'pointer',backdropFilter:'blur(8px)',
  };

  const PILLARS = [
    { icon:'🎙️', t:lang==='ru'?'Фонемный слух':'Phoneme-level ear',
      s:lang==='ru'?'Наша модель слышит каждый звук отдельно и говорит, что именно ты произносишь вместо него.':'Our own speech model hears every sound you make — and tells you what you said instead.' },
    { icon:'🧠', t:lang==='ru'?'Математика мастерства':'The mathematics of mastery',
      s:lang==='ru'?'BKT, ELO и интервальные повторения ведут твой профиль. Каждое упражнение — по мерке.':'Bayesian mastery, ELO ability, spaced repetition — every drill is cut to your measure.' },
    { icon:'✨', t:lang==='ru'?'ИИ-наставница':'A private AI mentor',
      s:lang==='ru'?'Мила собеседует тебя, определяет уровень и шьёт личную программу.':'Mila interviews you, places your level, and tailors a personal curriculum.' },
    { icon:'🇬🇧', t:lang==='ru'?'Три акцента':'Three native accents',
      s:lang==='ru'?'Лондон, Нью-Йорк, Мумбаи — настоящие голоса носителей, не синтетика.':'London, New York, Mumbai — real native voices, professionally recorded.' },
  ];

  const ROOMS = [
    { e:'🎧', t:lang==='ru'?'Салон произношения':'The Pronunciation Salon', s:lang==='ru'?'Слушай носителя, повторяй, получай оценку каждой фонемы':'Listen, repeat, get scored to the phoneme', href:'/listen' },
    { e:'📜', t:lang==='ru'?'Библиотека курсов':'The Course Library', s:lang==='ru'?'ИИ пишет уроки под твою цель — от собеседования до светской беседы':'AI writes lessons for your goal — interviews to small talk', href:'/lessons' },
    { e:'🗣️', t:lang==='ru'?'Голосовая гостиная':'The Voice Lounge', s:lang==='ru'?'Живой разговор с Милой — голосом, в реальном времени':'Live voice conversation with Mila, real-time', href:'/darshan' },
    { e:'📊', t:lang==='ru'?'Кабинет прогресса':'The Progress Study', s:lang==='ru'?'Твоя карта силы и слабости — до отдельного звука':'Your map of strengths — down to the single sound', href:'/progress' },
  ];

  return (
    <div style={{minHeight:'100vh',background:'transparent'}}>

      {/* ── NAV — dark glass, gold monogram ── */}
      <div style={{background:C.navBg,backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',padding:'14px 24px',
        borderBottom:'1px solid rgba(212,175,55,0.18)',position:'sticky',top:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:'50%',border:'1px solid rgba(212,175,55,0.6)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:'1.2rem',color:'#e8cd7a'}}>M</div>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.35rem',color:C.dark,letterSpacing:'0.04em'}}>
            Mila <span style={{color:'#c9a961',fontStyle:'italic'}}>{lang==='ru'?'· ателье английского':'· the English atelier'}</span>
          </span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <LangToggle />
          <button onClick={()=>router.push(isLoggedIn?'/dashboard':'/login')}
            style={{padding:'9px 22px',borderRadius:20,border:'1px solid rgba(212,175,55,0.55)',background:'transparent',
              color:'#e8cd7a',fontWeight:700,fontSize:'0.88rem',cursor:'pointer'}}>
            {isLoggedIn ? (lang==='ru'?'Кабинет':'Dashboard') : (lang==='ru'?'Войти':'Sign in')}
          </button>
        </div>
      </div>

      {/* ── HERO — cinematic, serif, over the living footage ── */}
      <div style={{maxWidth:880,margin:'0 auto',padding:'96px 24px 64px',textAlign:'center'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:10,padding:'7px 18px',borderRadius:999,
          border:'1px solid rgba(212,175,55,0.35)',background:'rgba(212,175,55,0.08)',backdropFilter:'blur(8px)',
          fontSize:'0.75rem',fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase',color:'#c9a961',marginBottom:28}}>
          {lang==='ru'?'Закрытый клуб английского':'A private club for English'}
        </div>
        <h1 style={{fontSize:'clamp(2.6rem,6vw,4.3rem)',lineHeight:1.08,margin:0,color:C.dark,fontWeight:600}}>
          {lang==='ru' ? <>Английский,<br/>сшитый <span className="gradient-text" style={{fontStyle:'italic'}}>по мерке</span></>
                       : <>English, tailored<br/><span className="gradient-text" style={{fontStyle:'italic'}}>to the phoneme</span></>}
        </h1>
        <p style={{fontSize:'1.13rem',color:C.warm,margin:'26px auto 0',lineHeight:1.75,maxWidth:620}}>
          {lang==='ru'
            ?'Мила слышит каждый звук твоей речи, измеряет мастерство математикой и шьёт персональную программу — как портной шьёт костюм. Для тех, кто учит английский всерьёз.'
            :'Mila hears every sound you speak, measures mastery with real mathematics, and cuts a personal curriculum the way a tailor cuts a suit. For people who take English seriously.'}
        </p>

        <div style={{display:'flex',gap:14,justifyContent:'center',marginTop:40,flexWrap:'wrap'}}>
          {isLoggedIn ? (
            <button onClick={()=>router.push('/dashboard')} style={goldBtn}>{lang==='ru'?'Войти в ателье →':'Enter the atelier →'}</button>
          ) : (
            <>
              <button onClick={()=>router.push('/register')} style={goldBtn}>{lang==='ru'?'Стать участником →':'Become a member →'}</button>
              <button onClick={guest} disabled={loading} style={ghostBtn}>{loading?'…':(lang==='ru'?'Осмотреться как гость':'Look around as a guest')}</button>
            </>
          )}
        </div>

        {/* proof strip */}
        <div style={{display:'flex',justifyContent:'center',gap:44,marginTop:64,flexWrap:'wrap'}}>
          {[{n:'392',l:lang==='ru'?'фонемы различает модель':'phonemes our model hears'},
            {n:'3',l:lang==='ru'?'живых акцента носителей':'native accents, real voices'},
            {n:'∞',l:lang==='ru'?'уроков пишет ИИ под тебя':'AI lessons cut to measure'}].map((s,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.4rem',fontWeight:600,color:'#e8cd7a'}}>{s.n}</div>
              <div style={{fontSize:'0.8rem',color:C.warm,letterSpacing:'0.04em'}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="hairline" style={{maxWidth:520,margin:'0 auto'}}/>

      {/* ── PILLARS — the craft ── */}
      <div style={{maxWidth:980,margin:'0 auto',padding:'72px 24px'}}>
        <div style={{textAlign:'center',marginBottom:44}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.26em',textTransform:'uppercase',color:'#c9a961',marginBottom:12}}>
            {lang==='ru'?'Ремесло':'The craft'}
          </div>
          <h2 style={{fontSize:'2.1rem',color:C.dark,margin:0}}>
            {lang==='ru'?'Почему это работает':'Why this works'}
          </h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16}}>
          {PILLARS.map((p,i)=>(
            <div key={i} className="glass-card" style={{padding:'28px 24px'}}>
              <div style={{fontSize:'1.9rem',marginBottom:14}}>{p.icon}</div>
              <div style={{fontWeight:800,fontSize:'1.02rem',color:C.dark,marginBottom:8}}>{p.t}</div>
              <div style={{fontSize:'0.87rem',color:C.warm,lineHeight:1.65}}>{p.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROOMS — the house tour ── */}
      <div style={{maxWidth:980,margin:'0 auto',padding:'8px 24px 72px'}}>
        <div style={{textAlign:'center',marginBottom:44}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.26em',textTransform:'uppercase',color:'#c9a961',marginBottom:12}}>
            {lang==='ru'?'Комнаты ателье':'The rooms'}
          </div>
          <h2 style={{fontSize:'2.1rem',color:C.dark,margin:0}}>
            {lang==='ru'?'Что внутри':'Inside the house'}
          </h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          {ROOMS.map((r,i)=>(
            <div key={i} onClick={()=>router.push(isLoggedIn?r.href:'/register')} className="glass-card"
              style={{padding:'30px 28px',cursor:'pointer',display:'flex',gap:18,alignItems:'flex-start'}}>
              <div style={{fontSize:'2rem',flexShrink:0,width:56,height:56,borderRadius:16,
                background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.25)',
                display:'flex',alignItems:'center',justifyContent:'center'}}>{r.e}</div>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:'1.35rem',color:C.dark}}>{r.t}</div>
                <div style={{fontSize:'0.88rem',color:C.warm,lineHeight:1.6,marginTop:5}}>{r.s}</div>
                <div style={{fontSize:'0.8rem',color:'#c9a961',fontWeight:700,marginTop:12,letterSpacing:'0.06em'}}>
                  {lang==='ru'?'Войти →':'Enter →'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INVITATION ── */}
      <div style={{maxWidth:640,margin:'0 auto',padding:'0 24px 96px',textAlign:'center'}}>
        <hr className="hairline" style={{marginBottom:56}}/>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontSize:'1.5rem',color:'#d8cfc0',lineHeight:1.6}}>
          {lang==='ru'
            ?'«Язык — это не предмет. Это второе гражданство.»'
            :'“A language is not a subject. It is a second citizenship.”'}
        </div>
        <div style={{marginTop:36}}>
          {isLoggedIn ? (
            <button onClick={()=>router.push('/dashboard')} style={goldBtn}>{lang==='ru'?'Продолжить обучение':'Continue your practice'}</button>
          ) : (
            <button onClick={()=>router.push('/register')} style={goldBtn}>{lang==='ru'?'Запросить приглашение →':'Request your invitation →'}</button>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{textAlign:'center',padding:'26px',color:'#7d7566',fontSize:'0.82rem',borderTop:'1px solid rgba(212,175,55,0.14)',
        background:'rgba(11,14,20,0.6)',backdropFilter:'blur(10px)'}}>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1rem',color:'#c9a961'}}>Mila</span>
        {' '}— {lang==='ru'?'ателье английского языка · Лондон · Москва · Мумбаи':'the English atelier · London · Moscow · Mumbai'}
      </div>
    </div>
  );
}
