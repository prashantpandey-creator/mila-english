// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function WordReviewWidget({ known, total, lang, onForgot, onKnow }: {
  known: number; total: number; lang: 'ru'|'en'; onForgot: () => void; onKnow: () => void;
}) {
  return (
    <div>
      <div style={{marginBottom:8}}>
        <span style={{fontSize:'0.85rem',color:C.warm}}>{known}/{total} {lang==='ru'?'выучено':'learned'}</span>
      </div>
      <div style={{display:'flex',gap:12}}>
        <button onClick={onForgot} style={{flex:1,padding:'14px',borderRadius:14,border:'2px solid #e5e0dc',background:'white',color:C.warm,fontWeight:600,cursor:'pointer',fontSize:'1rem'}}>
          {lang==='ru'?'Забыл(а)':'Forgot'}
        </button>
        <button onClick={onKnow} style={{flex:1,padding:'14px',borderRadius:14,border:'none',background:C.sage,color:'white',fontWeight:700,cursor:'pointer',fontSize:'1rem'}}>
          {lang==='ru'?'Помню ✅':'Know it ✅'}
        </button>
      </div>
    </div>
  );
}
