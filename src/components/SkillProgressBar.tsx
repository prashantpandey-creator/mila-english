// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

const SIGNAL = '#d9006c';

export default function SkillProgressBar({ label, val }: { label: string; val: number; color: string }) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',color:C.warm,marginBottom:4}}>
        <span>{label}</span><span>{val}%</span>
      </div>
      <div style={{height:8,borderRadius:4,background:'var(--mila-line, rgba(47,27,36,0.12))'}}>
        <div style={{height:'100%',borderRadius:4,width:`${val}%`,background:SIGNAL,transition:'width 0.4s'}}/>
      </div>
    </div>
  );
}
