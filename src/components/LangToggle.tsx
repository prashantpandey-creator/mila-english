// @ts-nocheck
'use client';

import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

export default function LangToggle() {
  const { lang, switchLang } = useI18n();
  return (
    <div style={{display:'flex',background:C.roseL,borderRadius:20,padding:2,gap:2}}>
      {(['ru','en'] as const).map(l => (
        <button key={l} onClick={()=>switchLang(l)}
          style={{padding:'5px 12px',borderRadius:18,border:'none',cursor:'pointer',
            fontSize:'0.75rem',fontWeight:700,letterSpacing:'0.02em',
            background:lang===l?C.rose:'transparent',color:lang===l?'white':C.warm,
            transition:'all 0.15s'}}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
