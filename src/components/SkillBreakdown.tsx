// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import SkillProgressBar from './SkillProgressBar';
import { Card } from '@/components/ui/Card';

export default function SkillBreakdown({ lang }: { lang: 'ru'|'en' }) {
  const skills = [
    { label: lang==='ru'?'Говорение':'Speaking', val: 62, color: C.mercury },
    { label: lang==='ru'?'Аудирование':'Listening', val: 74, color: C.voice },
    { label: lang==='ru'?'Словарь':'Vocabulary', val: 55, color: C.jupiter },
    { label: lang==='ru'?'Грамматика':'Grammar', val: 40, color: C.jupiter },
  ];
  return (
    <Card padding="20px" style={{marginTop:16,display:'flex',flexDirection:'column',gap:12}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark}}>
        {lang==='ru'?'По навыкам':'Skill breakdown'}
      </div>
      {skills.map((s,i)=>(<SkillProgressBar key={i} label={s.label} val={s.val} color={s.color}/>))}
    </Card>
  );
}
