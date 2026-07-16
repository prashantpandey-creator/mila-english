// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';

export default function LessonList({ lessons, onSelect }: {
  lessons: { id: number | string; icon: MilaIconName; title: string; sub: string; time: string; diffNum: number }[];
  onSelect: (id: number | string) => void;
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {lessons.map(l=>(
        <div key={l.id} onClick={()=>onSelect(l.id)}
          style={{cursor:'pointer',background:C.card,backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'16px 20px',
            boxShadow:'var(--surface-card-shadow)',display:'flex',alignItems:'center',gap:14,
            border:'2px solid transparent',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.jupiter;e.currentTarget.style.transform='translateY(-2px)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='none'}}>
          <div style={{width:44,height:44,borderRadius:14,background:C.jupiterL,color:'var(--jupiter-readable, var(--jupiter))',
            border:'1px solid color-mix(in srgb, var(--jupiter-readable, var(--jupiter)) 18%, transparent)',
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><MilaIcon name={l.icon} size={23}/></div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:'1rem',color:C.dark}}>{l.title}</div>
            <div style={{fontSize:'0.85rem',color:C.warm}}>{l.sub}</div>
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <span style={{fontSize:'0.75rem',color:C.warm,display:'inline-flex',alignItems:'center',gap:4}}><MilaIcon name="time" size={12}/>{l.time}</span>
              <span aria-label={`Difficulty ${l.diffNum} of 3`} style={{display:'inline-flex',alignItems:'center',gap:3}}>
                {[1,2,3].map(level=><i key={level} style={{width:7,height:7,borderRadius:'50%',border:`1px solid ${level<=l.diffNum?'var(--mercury-readable, var(--mercury))':C.line}`,background:level<=l.diffNum?'var(--mercury-readable, var(--mercury))':'var(--surface-control, transparent)'}}/>)}
              </span>
            </div>
          </div>
          <div style={{color:'var(--jupiter-readable, var(--jupiter))'}}><MilaIcon name="arrow" size={19}/></div>
        </div>
      ))}
    </div>
  );
}
