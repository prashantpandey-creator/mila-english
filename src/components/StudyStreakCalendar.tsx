// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card } from '@/components/ui/Card';

// Deterministic mock pattern — no live study-log data source yet, illustrates the last 4 weeks.
const STUDIED = [1,1,1,0,1,1,1, 1,0,1,1,1,0,1, 1,1,1,1,0,1,1, 0,1,1,1,1,1,1];

export default function StudyStreakCalendar({ lang }: { lang: 'ru'|'en' }) {
  return (
    <Card padding="20px" style={{marginTop:16}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:12}}>
        {lang==='ru'?'Последние 4 недели':'Last 4 weeks'}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
        {STUDIED.map((d,i)=>(
          <div key={i} style={{aspectRatio:'1',borderRadius:5,background:d?C.jupiter:'rgba(255,255,255,0.08)',boxShadow:d?'0 0 10px rgba(242,199,92,.1)':'none'}}/>
        ))}
      </div>
    </Card>
  );
}
