// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function ProgressSummary({ items }: {
  items: { emoji: string; val: number | string; label: string; color: string }[];
}) {
  return (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${items.length},1fr)`,gap:12}}>
      {items.map((s,i)=>(
        <div key={i} style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'16px 12px',textAlign:'center',boxShadow:'0 1px 8px rgba(0,0,0,0.45)'}}>
          <div style={{fontSize:'1.6rem'}}>{s.emoji}</div>
          <div style={{fontSize:'1.5rem',fontWeight:800,color:s.color}}>{s.val}</div>
          <div style={{fontSize:'0.75rem',color:C.warm}}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
