// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function CategoryFilter({ categories, active, onChange }: {
  categories: string[]; active: number; onChange: (i: number) => void;
}) {
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
      {categories.map((c,i)=>(
        <button key={i} onClick={()=>onChange(i)}
          style={{padding:'8px 16px',borderRadius:20,border:'none',cursor:'pointer',fontSize:'0.85rem',fontWeight:600,
            background:i===active?C.rose:'white',color:i===active?'white':C.warm,
            boxShadow:i===active?'0 2px 12px rgba(233,30,99,0.25)':'0 1px 4px rgba(0,0,0,0.45)'}}>
          {c}
        </button>
      ))}
    </div>
  );
}
