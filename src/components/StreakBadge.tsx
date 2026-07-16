// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon from '@/components/ui/MilaIcon';

export default function StreakBadge({ days, lang }: { days: number; lang: 'ru'|'en' }) {
  return (
    <div className="streak-card-v2" style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'18px 20px',
      display:'flex',alignItems:'center',gap:14,marginBottom:16,boxShadow:'var(--surface-card-shadow)'}}>
      <div style={{width:46,height:46,borderRadius:14,display:'grid',placeItems:'center',color:'var(--jupiter-readable, var(--jupiter))',background:C.jupiterL}}><MilaIcon name="streak" size={25}/></div>
      <div>
        <div style={{fontWeight:800,fontSize:'1.12rem',color:C.dark}}>{days} {lang==='ru'?'дней подряд':'day streak'}</div>
        <div style={{fontSize:'0.82rem',color:C.warm,marginTop:3}}>
          {lang==='ru'?'Не останавливайся!':"Don't break the chain!"}
        </div>
      </div>
    </div>
  );
}
