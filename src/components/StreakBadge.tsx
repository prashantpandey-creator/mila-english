// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function StreakBadge({ days, lang }: { days: number; lang: 'ru'|'en' }) {
  return (
    <div style={{background:`linear-gradient(135deg,${C.jupiter},${C.jupiterBright})`,borderRadius:20,padding:'20px 24px',
      display:'flex',alignItems:'center',gap:16,marginBottom:16,boxShadow:'0 4px 18px rgba(242,199,92,0.25)'}}>
      <div style={{fontSize:'2.5rem'}}>🔥</div>
      <div>
        <div style={{fontWeight:800,fontSize:'1.3rem',color:C.jupiterDeep}}>{days} {lang==='ru'?'дней подряд':'day streak'}</div>
        <div style={{fontSize:'0.85rem',color:C.jupiterDeep}}>
          {lang==='ru'?'Не останавливайся!':"Don't break the chain!"}
        </div>
      </div>
    </div>
  );
}
