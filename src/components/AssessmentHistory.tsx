// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

const HISTORY = [
  { date: '2 weeks ago', score: '14/20', level: 'A2' },
  { date: 'Today', score: '17/20', level: 'B1' },
];

export default function AssessmentHistory() {
  return (
    <div style={{marginTop:16}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:10}}>Previous attempts</div>
      {HISTORY.map((h,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
          background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:12,padding:'12px 16px',marginBottom:8,boxShadow:'0 1px 8px rgba(0,0,0,0.45)'}}>
          <span style={{fontSize:'0.85rem',color:C.warm}}>{h.date}</span>
          <span style={{fontSize:'0.85rem',fontWeight:700,color:C.dark}}>{h.score}</span>
          <span style={{fontSize:'0.8rem',fontWeight:700,color:C.jupiter}}>{h.level}</span>
        </div>
      ))}
    </div>
  );
}
