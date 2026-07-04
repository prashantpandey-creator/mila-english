// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import SkillProgressBar from './SkillProgressBar';

export default function SkillBreakdown({ lang }: { lang: 'ru'|'en' }) {
  const skills = [
    { label: lang==='ru'?'Говорение':'Speaking', val: 62, color: C.rose },
    { label: lang==='ru'?'Аудирование':'Listening', val: 74, color: C.sage },
    { label: lang==='ru'?'Словарь':'Vocabulary', val: 55, color: C.gold },
    { label: lang==='ru'?'Грамматика':'Grammar', val: 40, color: C.purple },
  ];
  return (
    <div style={{background:'white',borderRadius:16,padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)',marginTop:16,display:'flex',flexDirection:'column',gap:12}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark}}>
        {lang==='ru'?'По навыкам':'Skill breakdown'}
      </div>
      {skills.map((s,i)=>(<SkillProgressBar key={i} label={s.label} val={s.val} color={s.color}/>))}
    </div>
  );
}
