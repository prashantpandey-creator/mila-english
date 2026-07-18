// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

const SIGNAL = '#d9006c';

export default function ProgressRing({ percent, label, color = SIGNAL }: { percent: number; label: string; color?: string }) {
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--mila-line, rgba(47,27,36,0.14))" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{transition:'stroke-dashoffset 0.4s'}} />
        <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="800" fill={C.dark}>{percent}%</text>
      </svg>
      <div style={{fontSize:'0.8rem',color:C.warm,textAlign:'center'}}>{label}</div>
    </div>
  );
}
