// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function LevelIndicator({ level = 'B1' }: { level?: string }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',borderRadius:20,
      background:`linear-gradient(135deg,${C.purple},#5b21b6)`,color:'white',fontWeight:700,fontSize:'0.9rem'}}>
      Level: {level}
    </div>
  );
}
