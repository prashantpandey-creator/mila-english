// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function SkillProgressBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',color:C.warm,marginBottom:4}}>
        <span>{label}</span><span>{val}%</span>
      </div>
      <div style={{height:8,borderRadius:4,background:'rgba(255,255,255,0.08)'}}>
        <div style={{height:'100%',borderRadius:4,width:`${val}%`,background:color,transition:'width 0.4s'}}/>
      </div>
    </div>
  );
}
