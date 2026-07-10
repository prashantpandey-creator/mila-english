// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function DailyLessonCard({ title, subtitle, onStart }: {
  title: string; subtitle: string; onStart: () => void;
}) {
  return (
    <div onClick={onStart}
      style={{cursor:'pointer',borderRadius:20,overflow:'hidden',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',
        boxShadow:'0 2px 20px rgba(0,0,0,0.06)',marginBottom:20,transition:'all 0.2s',border:'2px solid transparent'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rose;e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='none'}}>
      <div style={{height:2,background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.8),transparent)'}}/>
      <div style={{display:'flex',alignItems:'center',padding:'20px 24px',gap:16}}>
        <div style={{width:56,height:56,borderRadius:16,background:C.roseL,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem'}}>📖</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:'1.1rem',color:C.dark}}>{title}</div>
          <div style={{fontSize:'0.85rem',color:C.warm,marginTop:2}}>{subtitle}</div>
        </div>
        <div style={{fontSize:'1.5rem',color:C.rose}}>→</div>
      </div>
    </div>
  );
}
