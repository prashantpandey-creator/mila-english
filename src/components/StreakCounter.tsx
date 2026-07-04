// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function StreakCounter({ days, lang }: { days: number; lang: 'ru'|'en' }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',
      borderRadius:20,background:C.goldL,color:C.gold,fontWeight:700,fontSize:'0.8rem'}}>
      🔥 {days} {lang==='ru'?'дней подряд':'day streak'}
    </div>
  );
}
