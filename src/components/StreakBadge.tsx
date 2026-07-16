// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon from '@/components/ui/MilaIcon';

export default function StreakBadge({ days, lang }: { days: number; lang: 'ru'|'en' }) {
  return (
    <div style={{background:`linear-gradient(135deg,${C.jupiter},${C.jupiterBright})`,borderRadius:20,padding:'20px 24px',
      display:'flex',alignItems:'center',gap:16,marginBottom:16,boxShadow:'0 4px 18px rgba(242,199,92,0.25)'}}>
      <div style={{width:48,height:48,borderRadius:16,display:'grid',placeItems:'center',color:C.jupiterDeep,background:'rgba(255,255,255,.34)',border:'1px solid rgba(63,45,5,.14)'}}><MilaIcon name="streak" size={27}/></div>
      <div>
        <div style={{fontWeight:800,fontSize:'1.3rem',color:C.jupiterDeep}}>{days} {lang==='ru'?'дней подряд':'day streak'}</div>
        <div style={{fontSize:'0.85rem',color:C.jupiterDeep}}>
          {lang==='ru'?'Не останавливайся!':"Don't break the chain!"}
        </div>
      </div>
    </div>
  );
}
