// @ts-nocheck
'use client';

import { useState } from 'react';
import { C } from '@/lib/theme';

const QUESTIONS = [
  { q: 'She ___ to the store yesterday.', options: ['go', 'goes', 'went', 'gone'], answer: 'went' },
  { q: 'I have ___ this movie before.', options: ['see', 'saw', 'seen', 'seeing'], answer: 'seen' },
];

export default function AssessmentPlayer() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = QUESTIONS[i];
  return (
    <div className="focus-card" style={{padding:'20px',marginTop:16}}>
      <div style={{fontSize:'0.8rem',color:C.warm,marginBottom:8}}>Question {i+1} / {QUESTIONS.length}</div>
      <div style={{fontWeight:700,fontSize:'1rem',color:C.dark,marginBottom:14}}>{q.q}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {q.options.map(o=>(
          <button key={o} onClick={()=>setPicked(o)}
            style={{padding:'10px',borderRadius:10,cursor:'pointer',fontSize:'0.9rem',
              border:picked===o?`2px solid ${C.mercury}`:'1.5px solid rgba(255,255,255,0.14)',
              background:picked===o?C.mercuryL:'rgba(255,255,255,0.05)',color:C.dark}}>
            {o}
          </button>
        ))}
      </div>
      <button disabled={!picked} onClick={()=>{setI(Math.min(i+1,QUESTIONS.length-1)); setPicked(null);}}
        style={{marginTop:14,padding:'10px 20px',borderRadius:10,border:'none',
          background:picked?C.mercury:'rgba(255,255,255,0.14)',color:picked?C.white:C.warm,fontWeight:600,cursor:picked?'pointer':'default'}}>
        Next →
      </button>
    </div>
  );
}
