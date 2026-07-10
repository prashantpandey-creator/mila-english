// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function ProgressChart({ lang }: { lang: 'ru'|'en' }) {
  const days = lang==='ru' ? ['П','В','С','Ч','П','С','В'] : ['M','T','W','T','F','S','S'];
  const minutes = [12, 20, 0, 18, 25, 30, 8];
  const max = Math.max(...minutes, 1);
  return (
    <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.45)',marginTop:16}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:16}}>
        {lang==='ru'?'Активность за неделю':'This week'}
      </div>
      <div style={{display:'flex',alignItems:'flex-end',gap:8,height:100}}>
        {minutes.map((m,i)=>(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div style={{width:'100%',borderRadius:6,background:m>0?C.sage:'rgba(255,255,255,0.14)',height:`${Math.max((m/max)*80,4)}px`}}/>
            <div style={{fontSize:'0.7rem',color:C.warm}}>{days[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
