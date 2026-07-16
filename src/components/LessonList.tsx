// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function LessonList({ lessons, onSelect }: {
  lessons: { id: number; cat: string; title: string; sub: string; time: string; diffNum: number }[];
  onSelect: (id: number) => void;
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {lessons.map(l=>(
        <div key={l.id} onClick={()=>onSelect(l.id)}
          style={{cursor:'pointer',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'16px 20px',
            boxShadow:'0 1px 8px rgba(0,0,0,0.45)',display:'flex',alignItems:'center',gap:14,
            border:'2px solid transparent',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.jupiter;e.currentTarget.style.transform='translateY(-2px)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='none'}}>
          <div style={{width:44,height:44,borderRadius:14,background:C.jupiterL,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>{l.cat}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:'1rem',color:C.dark}}>{l.title}</div>
            <div style={{fontSize:'0.85rem',color:C.warm}}>{l.sub}</div>
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <span style={{fontSize:'0.75rem',color:C.warm}}>⏱ {l.time}</span>
              <span style={{fontSize:'0.75rem',color:C.warm}}>{'🟢'.repeat(l.diffNum)}{'⚪'.repeat(3-l.diffNum)}</span>
            </div>
          </div>
          <div style={{fontSize:'1.2rem',color:C.jupiter}}>→</div>
        </div>
      ))}
    </div>
  );
}
