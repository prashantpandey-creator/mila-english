// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function MouthDiagram({ sound = '/θ/' }: { sound?: string }) {
  return (
    <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.45)',marginTop:16,textAlign:'center'}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:10}}>Tongue position for {sound}</div>
      <svg width="120" height="90" viewBox="0 0 120 90">
        <path d="M10 60 Q10 20 60 20 Q110 20 110 60 Q110 80 60 80 Q10 80 10 60Z" fill="none" stroke={C.warm} strokeWidth="2"/>
        <ellipse cx="55" cy="55" rx="30" ry="14" fill={C.roseL} stroke={C.rose} strokeWidth="1.5"/>
        <circle cx="30" cy="55" r="3" fill={C.rose}/>
      </svg>
    </div>
  );
}
