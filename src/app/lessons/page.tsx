// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

const C = {
  rose: '#e91e63', roseL: '#fce4ec', sage: '#5b8c5a', sageL: '#e8f5e9',
  gold: '#f59e0b', goldL: '#fef3c7', warm: '#78716c', dark: '#44403c',
};

const LESSONS_RU = [
  {id:1,cat:'🗣️',catName:'Разговор',title:'Знакомство',sub:'Представься и спроси имя',time:'3 мин',diff:'Лёгкий',diffNum:1,
   words:['Hello','My name is...','Nice to meet you','Where are you from?','I am from Russia']},
  {id:2,cat:'☕',catName:'Разговор',title:'В кафе',sub:'Закажи кофе и еду',time:'5 мин',diff:'Лёгкий',diffNum:1,
   words:['I would like...','A coffee please','How much is it?','The menu please','Thank you']},
  {id:3,cat:'✈️',catName:'Разговор',title:'В аэропорту',sub:'Пройди регистрацию и паспортный контроль',time:'7 мин',diff:'Средний',diffNum:2,
   words:['Where is the gate?','My flight is at...','Boarding pass','Passport control','Carry-on luggage']},
  {id:4,cat:'🔤',catName:'Фонетика',title:'Сложные звуки',sub:'th, w, r — звуки, которых нет в русском',time:'5 мин',diff:'Средний',diffNum:2,
   words:['think','through','weather','world','river']},
  {id:5,cat:'📝',catName:'Слова',title:'Базовые глаголы',sub:'Самые нужные глаголы для everyday',time:'4 мин',diff:'Лёгкий',diffNum:1,
   words:['be','have','do','go','make','get','know','think','see','come']},
  {id:6,cat:'📝',catName:'Слова',title:'Эмоции и чувства',sub:'Описывай свои чувства точно',time:'5 мин',diff:'Средний',diffNum:2,
   words:['happy','excited','worried','confused','grateful','overwhelmed','proud']},
  {id:7,cat:'🎧',catName:'Аудирование',title:'Медленная речь',sub:'Понимай медленную английскую речь',time:'5 мин',diff:'Лёгкий',diffNum:1},
  {id:8,cat:'🎧',catName:'Аудирование',title:'Естественная скорость',sub:'Учись понимать носителей',time:'7 мин',diff:'Сложный',diffNum:3},
];

const LESSONS_EN = [
  {id:1,cat:'🗣️',catName:'Speaking',title:'Introductions',sub:'Introduce yourself and ask names',time:'3 min',diff:'Easy',diffNum:1,
   words:['Hello','My name is...','Nice to meet you','Where are you from?','I am from Russia']},
  {id:2,cat:'☕',catName:'Speaking',title:'At a Café',sub:'Order coffee and food',time:'5 min',diff:'Easy',diffNum:1,
   words:['I would like...','A coffee please','How much is it?','The menu please','Thank you']},
  {id:3,cat:'✈️',catName:'Speaking',title:'At the Airport',sub:'Check in and go through passport control',time:'7 min',diff:'Medium',diffNum:2,
   words:['Where is the gate?','My flight is at...','Boarding pass','Passport control','Carry-on luggage']},
  {id:4,cat:'🔤',catName:'Phonetics',title:'Tricky Sounds',sub:'th, w, r — sounds Russian doesn\'t have',time:'5 min',diff:'Medium',diffNum:2,
   words:['think','through','weather','world','river']},
  {id:5,cat:'📝',catName:'Vocabulary',title:'Essential Verbs',sub:'The most important everyday verbs',time:'4 min',diff:'Easy',diffNum:1,
   words:['be','have','do','go','make','get','know','think','see','come']},
  {id:6,cat:'📝',catName:'Vocabulary',title:'Emotions',sub:'Express your feelings precisely',time:'5 min',diff:'Medium',diffNum:2,
   words:['happy','excited','worried','confused','grateful','overwhelmed','proud']},
  {id:7,cat:'🎧',catName:'Listening',title:'Slow Speech',sub:'Understand slow English speech',time:'5 min',diff:'Easy',diffNum:1},
  {id:8,cat:'🎧',catName:'Listening',title:'Natural Speed',sub:'Learn to understand native speakers',time:'7 min',diff:'Hard',diffNum:3},
];

const CATS_RU = ['Все','Разговор','Фонетика','Слова','Аудирование'];
const CATS_EN = ['All','Speaking','Phonetics','Vocabulary','Listening'];

export default function LessonsPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [activeCat, setActiveCat] = useState(0);
  const lessons = lang==='ru' ? LESSONS_RU : LESSONS_EN;
  const cats = lang==='ru' ? CATS_RU : CATS_EN;
  
  const filtered = activeCat === 0 ? lessons : lessons.filter(l => {
    const catName = lang==='ru' ? l.catName : l.catName;
    return catName === cats[activeCat] || 
      (cats[activeCat]==='Speaking' && l.catName==='Разговор') ||
      (cats[activeCat]==='Phonetics' && l.catName==='Фонетика') ||
      (cats[activeCat]==='Vocabulary' && l.catName==='Слова') ||
      (cats[activeCat]==='Listening' && l.catName==='Аудирование');
  });

  return (
    <div style={{minHeight:'100vh',background:'#fef9f4',fontFamily:"'Nunito','Inter',sans-serif"}}>
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span>
        <LangToggle />
      </div>

      <div style={{maxWidth:600,margin:'0 auto',padding:'24px 20px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark,margin:0}}>{t('lessons_title')}</h1>
        <p style={{color:C.warm,margin:'4px 0 20px'}}>{t('lessons_subtitle')}</p>

        {/* Category filter */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
          {cats.map((c,i)=>(
            <button key={i} onClick={()=>setActiveCat(i)}
              style={{padding:'8px 16px',borderRadius:20,border:'none',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,
                background:i===activeCat?C.rose:'white',color:i===activeCat?'white':C.warm,
                boxShadow:i===activeCat?'0 2px 12px rgba(233,30,99,0.25)':'0 1px 4px rgba(0,0,0,0.04)'}}>
              {c}
            </button>
          ))}
        </div>

        {/* Lesson cards */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {filtered.map(l=>(
            <div key={l.id} onClick={()=>router.push(`/lessons/${l.id}`)}
              style={{cursor:'pointer',background:'white',borderRadius:16,padding:'16px 20px',
                boxShadow:'0 1px 8px rgba(0,0,0,0.04)',display:'flex',alignItems:'center',gap:14,
                border:'2px solid transparent',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rose;e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='none'}}>
              <div style={{width:44,height:44,borderRadius:14,background:C.roseL,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>{l.cat}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:'1rem',color:C.dark}}>{l.title}</div>
                <div style={{fontSize:'0.85rem',color:C.warm}}>{l.sub}</div>
                <div style={{display:'flex',gap:8,marginTop:4}}>
                  <span style={{fontSize:'0.75rem',color:C.warm}}>⏱ {l.time}</span>
                  <span style={{fontSize:'0.75rem',color:C.warm}}>
                    {'🟢'.repeat(l.diffNum)}{'⚪'.repeat(3-l.diffNum)}
                  </span>
                </div>
              </div>
              <div style={{fontSize:'1.2rem',color:C.rose}}>→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
