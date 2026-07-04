// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

const INTERVALS = [1, 2, 4, 7, 15, 30];

export default function SpacedRepetitionTimer({ repetitionCount, lang }: { repetitionCount: number; lang: 'ru'|'en' }) {
  const days = INTERVALS[Math.min(repetitionCount, INTERVALS.length - 1)];
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:20,
      background:C.sageL,color:C.sage,fontWeight:600,fontSize:'0.75rem'}}>
      ⏱ {lang==='ru'?`Повтор через ${days} дн.`:`Next review in ${days}d`}
    </div>
  );
}
