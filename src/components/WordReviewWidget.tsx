// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon from '@/components/ui/MilaIcon';

export default function WordReviewWidget({ known, total, lang, onForgot, onKnow }: {
  known: number; total: number; lang: 'ru'|'en'; onForgot: () => void; onKnow: () => void;
}) {
  return (
    <div>
      <div style={{marginBottom:8}}>
        <span style={{fontSize:'0.85rem',color:C.warm}}>{known}/{total} {lang==='ru'?'выучено':'learned'}</span>
      </div>
      <div style={{display:'flex',gap:12}}>
        <button onClick={onForgot} style={{flex:1,padding:'14px',borderRadius:14,border:'2px solid rgba(255,255,255,0.14)',background:'var(--surface-control,rgba(255,255,255,0.05))',color:C.warm,fontWeight:600,cursor:'pointer',fontSize:'1rem'}}>
          {lang==='ru'?'Забыл(а)':'Forgot'}
        </button>
        <button onClick={onKnow} style={{flex:1,padding:'14px',borderRadius:14,border:'none',background:`linear-gradient(135deg,${C.mercuryBright},${C.mercury})`,color:'#031d14',fontWeight:800,cursor:'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          {lang==='ru'?'Помню':'Know it'} <MilaIcon name="practice" size={17}/>
        </button>
      </div>
    </div>
  );
}
