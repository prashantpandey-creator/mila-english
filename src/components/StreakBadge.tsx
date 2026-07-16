// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function StreakBadge({ days, lang }: { days: number; lang: 'ru'|'en' }) {
  return (
    <div style={{background:`linear-gradient(135deg,${C.gold},#e67e22)`,borderRadius:20,padding:'20px 24px',
      display:'flex',alignItems:'center',gap:16,marginBottom:16,boxShadow:'0 4px 18px rgba(212,175,55,0.25)'}}>
      <div style={{fontSize:'2.5rem'}}>🔥</div>
      <div>
        <div style={{fontWeight:800,fontSize:'1.3rem',color:'white'}}>{days} {lang==='ru'?'дней подряд':'day streak'}</div>
        <div style={{fontSize:'0.85rem',color:'rgba(0,0,0,0.84)'}}>
          {lang==='ru'?'Не останавливайся!':"Don't break the chain!"}
        </div>
      </div>
    </div>
  );
}
