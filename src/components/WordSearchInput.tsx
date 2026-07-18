// @ts-nocheck
'use client';

import { useState } from 'react';

export default function WordSearchInput({ onSearch }: { onSearch?: (q: string) => void }) {
  const [q, setQ] = useState('');
  return (
    <div style={{display:'flex',gap:8,marginTop:16}}>
      <input value={q} onChange={e=>{setQ(e.target.value); onSearch?.(e.target.value);}}
        placeholder="Search a word..."
        style={{flex:1,padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--mila-line, #efd6df)',background:'var(--mila-panel, #ffffff)',color:'var(--mila-ink, #2f1b24)',fontSize:'0.9rem',outline:'none'}}/>
    </div>
  );
}
