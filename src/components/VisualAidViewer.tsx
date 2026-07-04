// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function VisualAidViewer({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div style={{background:C.sageL,borderRadius:16,padding:'20px',textAlign:'center',marginBottom:16}}>
      <div style={{fontSize:'2.5rem'}}>{emoji}</div>
      <div style={{fontSize:'0.85rem',color:C.dark,fontWeight:600,marginTop:6}}>{title}</div>
    </div>
  );
}
