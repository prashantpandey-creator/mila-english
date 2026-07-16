// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function WeakAreasAlert({ lang }: { lang: 'ru'|'en' }) {
  return (
    <div style={{background:C.roseL,border:`1px solid ${C.rose}`,borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,marginTop:16}}>
      <span style={{fontSize:'1.3rem'}}>💡</span>
      <div>
        <div style={{fontWeight:700,fontSize:'0.85rem',color:C.rose}}>
          {lang==='ru'?'Зона роста: фразовые глаголы':'Focus area: phrasal verbs'}
        </div>
        <div style={{fontSize:'0.78rem',color:C.warm,marginTop:2}}>
          {lang==='ru'?'Основано на твоих последних тестах':'Based on your recent assessments'}
        </div>
      </div>
    </div>
  );
}
