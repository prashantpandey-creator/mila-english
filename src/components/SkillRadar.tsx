// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

const SKILLS = [
  { label: 'Speaking', val: 0.6 }, { label: 'Listening', val: 0.75 },
  { label: 'Reading', val: 0.8 }, { label: 'Writing', val: 0.5 }, { label: 'Grammar', val: 0.45 },
];

export default function SkillRadar() {
  const cx = 110, cy = 110, r = 55;
  const pts = SKILLS.map((s, i) => {
    const angle = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2;
    const x = cx + Math.cos(angle) * r * s.val;
    const y = cy + Math.sin(angle) * r * s.val;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.45)',marginTop:16,textAlign:'center'}}>
      <svg width="220" height="220" viewBox="0 0 220 220">
        {[0.33,0.66,1].map(f=>(
          <circle key={f} cx={cx} cy={cy} r={r*f} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
        ))}
        <polygon points={pts} fill={C.mercuryL} stroke={C.mercury} strokeWidth="2" opacity="0.85"/>
        {SKILLS.map((s,i)=>{
          const angle = (Math.PI*2*i)/SKILLS.length - Math.PI/2;
          const lx = cx + Math.cos(angle)*(r+25), ly = cy + Math.sin(angle)*(r+25);
          return <text key={i} x={lx} y={ly} textAnchor="middle" fontSize="9" fill={C.warm}>{s.label}</text>;
        })}
      </svg>
    </div>
  );
}
