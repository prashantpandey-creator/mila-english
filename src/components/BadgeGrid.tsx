// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';

export default function BadgeGrid({ badges }: { badges: { icon: MilaIconName; t: string; d: string; u: boolean }[] }) {
  return (
    <div className="badge-grid" style={{display:'grid',gap:10,marginTop:16}}>
      {badges.map((b,i)=>(
        <div className={`badge-tile ${b.u?'is-unlocked':'is-locked'}`} key={i} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'16px 10px',textAlign:'center',boxShadow:'none'}}>
          <div style={{width:42,height:42,margin:'0 auto',borderRadius:14,display:'grid',placeItems:'center',color:b.u?'var(--jupiter-readable, var(--jupiter))':C.warm,background:b.u?C.jupiterL:'var(--surface-control, transparent)',border:`1px solid ${C.line}`}}><MilaIcon name={b.u?b.icon:'lock'} size={23}/></div>
          <div className="badge-tile__title" style={{fontWeight:700,fontSize:'0.85rem',color:C.dark,marginTop:7}}>{b.t}</div>
          <div className="badge-tile__copy" style={{fontSize:'0.7rem',color:C.warm,marginTop:3}}>{b.d}</div>
        </div>
      ))}
    </div>
  );
}
