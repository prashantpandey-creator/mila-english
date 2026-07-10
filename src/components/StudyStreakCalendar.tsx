// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

// Deterministic mock pattern — no live study-log data source yet, illustrates the last 4 weeks.
const STUDIED = [1,1,1,0,1,1,1, 1,0,1,1,1,0,1, 1,1,1,1,0,1,1, 0,1,1,1,1,1,1];

export default function StudyStreakCalendar({ lang }: { lang: 'ru'|'en' }) {
  return (
    <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.45)',marginTop:16}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:12}}>
        {lang==='ru'?'Последние 4 недели':'Last 4 weeks'}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
        {STUDIED.map((d,i)=>(
          <div key={i} style={{aspectRatio:'1',borderRadius:5,background:d?C.sage:'rgba(255,255,255,0.08)'}}/>
        ))}
      </div>
    </div>
  );
}
