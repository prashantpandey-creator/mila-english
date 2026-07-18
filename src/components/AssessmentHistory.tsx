// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card } from '@/components/ui/Card';

const SIGNAL = '#b63d68';

const HISTORY = [
  { date: '2 weeks ago', score: '14/20', level: 'A2' },
  { date: 'Today', score: '17/20', level: 'B1' },
];

export default function AssessmentHistory() {
  return (
    <div style={{marginTop:16}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:10}}>Previous attempts</div>
      {HISTORY.map((h,i)=>(
        <Card key={i} padding="12px 16px" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:'0.85rem',color:C.warm}}>{h.date}</span>
          <span style={{fontSize:'0.85rem',fontWeight:700,color:C.dark}}>{h.score}</span>
          <span style={{fontSize:'0.8rem',fontWeight:700,color:SIGNAL}}>{h.level}</span>
        </Card>
      ))}
    </div>
  );
}
