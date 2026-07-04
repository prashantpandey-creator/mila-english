// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

const C = {
  pageBg: '#fef9f4', rose: '#e91e63', roseL: '#fce4ec',
  sage: '#5b8c5a', sageL: '#e8f5e9', gold: '#f59e0b', goldL: '#fef3c7',
  warm: '#78716c', dark: '#44403c',
};

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [m, setM] = useState(false);
  useEffect(()=>{setM(true)},[]);
  if (!m) return null;

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Nunito','Inter',sans-serif"}}>
      {/* Top Bar */}
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(0,0,0,0.04)',position:'sticky',top:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div onClick={()=>router.push('/')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>
          🌸 Мила
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <LangToggle />
          <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${C.rose},#c2185b)`,
            display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.8rem'}}>
            {lang==='ru'?'А':'A'}
          </div>
        </div>
      </div>

      <div style={{maxWidth:560,margin:'0 auto',padding:'28px 20px'}}>
        {/* Greeting */}
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:'1.6rem',fontWeight:800,margin:0,color:C.dark}}>
            {lang==='ru'?'Доброе утро ☀️':'Good morning ☀️'}
          </h1>
          <p style={{color:C.warm,margin:'4px 0 0'}}>
            {lang==='ru'?'Готова позаниматься?':'Ready to practice?'}
          </p>
        </div>

        {/* Main CTA — Start Lesson */}
        <div onClick={()=>router.push('/lessons')}
          style={{cursor:'pointer',borderRadius:20,overflow:'hidden',background:'white',
            boxShadow:'0 2px 20px rgba(0,0,0,0.06)',marginBottom:20,transition:'all 0.2s',border:'2px solid transparent'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rose;e.currentTarget.style.transform='translateY(-2px)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='none'}}>
          <div style={{height:6,background:`linear-gradient(90deg,${C.rose},${C.gold},${C.sage})`}}/>
          <div style={{display:'flex',alignItems:'center',padding:'20px 24px',gap:16}}>
            <div style={{width:56,height:56,borderRadius:16,background:C.roseL,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem'}}>📖</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:'1.1rem',color:C.dark}}>{lang==='ru'?'Начать урок':'Start Today\'s Lesson'}</div>
              <div style={{fontSize:'0.85rem',color:C.warm,marginTop:2}}>{lang==='ru'?'Разговор • 5 мин • Лёгкий':'Speaking • 5 min • Easy'}</div>
            </div>
            <div style={{fontSize:'1.5rem',color:C.rose}}>→</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
          {[
            {emoji:'🔥',val:5,label:lang==='ru'?'Дней':'Streak',bg:C.goldL,color:C.gold},
            {emoji:'📝',val:8,label:lang==='ru'?'Слов':'Words',bg:C.roseL,color:C.rose},
            {emoji:'⭐',val:12,label:lang==='ru'?'Уроков':'Lessons',bg:C.sageL,color:C.sage},
          ].map((s,i)=>(
            <div key={i} style={{background:'white',borderRadius:16,padding:'16px 12px',textAlign:'center',boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
              <div style={{fontSize:'1.6rem'}}>{s.emoji}</div>
              <div style={{fontSize:'1.5rem',fontWeight:800,color:s.color}}>{s.val}</div>
              <div style={{fontSize:'0.75rem',color:C.warm}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pronunciation */}
        <div style={{background:'white',borderRadius:20,padding:'20px 24px',boxShadow:'0 1px 8px rgba(0,0,0,0.04)',marginBottom:16,textAlign:'center'}}>
          <div style={{fontWeight:700,fontSize:'1rem',color:C.dark,marginBottom:4}}>🎤 {lang==='ru'?'Произношение':'Pronunciation'}</div>
          <p style={{fontSize:'0.85rem',color:C.warm,margin:'0 0 14px'}}>{lang==='ru'?'Нажми и послушай':'Tap to listen'}</p>
          <div style={{display:'flex',justifyContent:'center',gap:20}}>
            {['hello','world','thank you'].map(w=>(
              <div key={w} style={{textAlign:'center'}}>
                <div style={{fontWeight:600,fontSize:'1rem',color:C.dark,marginBottom:6}}>{w}</div>
                <div onClick={()=>{const u=new SpeechSynthesisUtterance(w);u.lang='en-US';u.rate=0.8;speechSynthesis.speak(u)}}
                  style={{cursor:'pointer',width:52,height:52,borderRadius:'50%',background:C.roseL,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',margin:'0 auto'}}>
                  🔊
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:30}}>
          {[
            {emoji:'📚',label:lang==='ru'?'Уроки':'Lessons',sub:lang==='ru'?'По темам':'By topic',href:'/lessons',color:C.sage},
            {emoji:'📊',label:lang==='ru'?'Прогресс':'Progress',sub:lang==='ru'?'Статистика':'Stats',href:'/progress',color:'#7c3aed'},
            {emoji:'📖',label:lang==='ru'?'Словарь':'Vocabulary',sub:lang==='ru'?'Повторение':'Review',href:'/vocabulary',color:C.gold},
            {emoji:'🏆',label:lang==='ru'?'Успехи':'Badges',sub:lang==='ru'?'Награды':'Achievements',href:'/achievements',color:C.rose},
          ].map((l,i)=>(
            <div key={i} onClick={()=>router.push(l.href)}
              style={{cursor:'pointer',background:'white',borderRadius:16,padding:'16px',boxShadow:'0 1px 8px rgba(0,0,0,0.04)',
                display:'flex',alignItems:'center',gap:12,transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}}>
              <div style={{width:40,height:40,borderRadius:12,background:l.color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem'}}>{l.emoji}</div>
              <div><div style={{fontWeight:600,fontSize:'0.95rem',color:C.dark}}>{l.label}</div><div style={{fontSize:'0.8rem',color:C.warm}}>{l.sub}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
