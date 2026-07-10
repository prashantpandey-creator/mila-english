// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function LeaderboardCard({ lang }: { lang: 'ru'|'en' }) {
  return (
    <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'16px 20px',boxShadow:'0 1px 8px rgba(0,0,0,0.45)',
      display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
      <div style={{width:44,height:44,borderRadius:14,background:C.sageL,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem'}}>🏅</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:'0.95rem',color:C.dark}}>
          {lang==='ru'?'Ты в топ-20% на этой неделе':"You're in the top 20% this week"}
        </div>
        <div style={{fontSize:'0.8rem',color:C.warm,marginTop:2}}>
          {lang==='ru'?'Среди русскоговорящих учеников':'Among Russian-speaking learners'}
        </div>
      </div>
    </div>
  );
}
