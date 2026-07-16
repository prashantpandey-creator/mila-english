// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';

export default function BadgeGrid({ badges }: { badges: { icon: MilaIconName; t: string; d: string; u: boolean }[] }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:16}}>
      {badges.map((b,i)=>(
        <div key={i} style={{background:b.u?C.card:'var(--surface-control, rgba(255,255,255,0.08))',border:`1px solid ${C.line}`,borderRadius:16,padding:'16px 10px',textAlign:'center',
          opacity:b.u?1:0.62,boxShadow:b.u?'var(--surface-card-shadow)':'none'}}>
          <div style={{width:42,height:42,margin:'0 auto',borderRadius:14,display:'grid',placeItems:'center',color:b.u?'var(--jupiter-readable, var(--jupiter))':C.warm,background:b.u?C.jupiterL:'var(--surface-control, transparent)',border:`1px solid ${C.line}`}}><MilaIcon name={b.u?b.icon:'lock'} size={23}/></div>
          <div style={{fontWeight:700,fontSize:'0.85rem',color:C.dark,marginTop:4}}>{b.t}</div>
          <div style={{fontSize:'0.7rem',color:C.warm,marginTop:2}}>{b.d}</div>
        </div>
      ))}
    </div>
  );
}
