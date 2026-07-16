// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon from '@/components/ui/MilaIcon';

export default function StreakCounter({ days, lang }: { days: number; lang: 'ru'|'en' }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',
      borderRadius:20,background:C.jupiterL,color:C.jupiter,fontWeight:700,fontSize:'0.8rem',
      border:'1px solid rgba(242,199,92,.16)'}}>
      <MilaIcon name="streak" size={14}/> {days} {lang==='ru'?'дней подряд':'day streak'}
    </div>
  );
}
