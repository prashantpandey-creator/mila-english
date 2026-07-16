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
            background:i===active?C.mercury:'rgba(255,255,255,0.07)',color:i===active?'#031d14':C.warm,
            boxShadow:i===active?'0 4px 16px rgba(36,211,154,.2)':'0 1px 4px rgba(0,0,0,0.45)'}}>
          {c}
        </button>
      ))}
    </div>
  );
}
