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
    <div style={{background:'white',borderRadius:16,padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)',marginTop:16}}>
      <div style={{fontSize:'0.8rem',color:C.warm,marginBottom:8}}>Question {i+1} / {QUESTIONS.length}</div>
      <div style={{fontWeight:700,fontSize:'1rem',color:C.dark,marginBottom:14}}>{q.q}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {q.options.map(o=>(
          <button key={o} onClick={()=>setPicked(o)}
            style={{padding:'10px',borderRadius:10,cursor:'pointer',fontSize:'0.9rem',
              border:picked===o?`2px solid ${C.rose}`:'1.5px solid #e5e0dc',
              background:picked===o?C.roseL:'white',color:C.dark}}>
            {o}
          </button>
        ))}
      </div>
      <button disabled={!picked} onClick={()=>{setI(Math.min(i+1,QUESTIONS.length-1)); setPicked(null);}}
        style={{marginTop:14,padding:'10px 20px',borderRadius:10,border:'none',
          background:picked?C.sage:'#e5e0dc',color:'white',fontWeight:600,cursor:picked?'pointer':'default'}}>
        Next →
      </button>
    </div>
  );
}
