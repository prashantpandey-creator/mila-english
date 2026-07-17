// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card } from '@/components/ui/Card';

export default function WordCard({ word, flipped, onFlip, lang }: {
  word: { en: string; ru: string; phonetic: string }; flipped: boolean; onFlip: () => void; lang: 'ru'|'en';
}) {
  return (
    <Card onClick={onFlip} padding={32} className="word-card"
      style={{width:'100%',minHeight:220,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        marginBottom:20,userSelect:'none',font:'inherit',textAlign:'center',color:'inherit',appearance:'none'}}>
      <div style={{fontSize:flipped?'1.1rem':'2rem',fontWeight:flipped?500:700,color:flipped?C.warm:C.dark,marginBottom:8}}>
        {flipped ? word.ru : word.en}
      </div>
      <div style={{fontSize:flipped?'1.2rem':'1rem',color:flipped?C.voice:C.warm,marginTop:flipped?4:0}}>{word.phonetic}</div>
      <div style={{marginTop:12,fontSize:'0.8rem',color:C.warm}}>{lang==='ru'?'Нажми, чтобы перевернуть':'Tap to flip'}</div>
    </Card>
  );
}
