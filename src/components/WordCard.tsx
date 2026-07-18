// @ts-nocheck
'use client';

import { Card } from '@/components/ui/Card';

export default function WordCard({ word, flipped, onFlip, lang }: {
  word: { en: string; ru: string; phonetic: string }; flipped: boolean; onFlip: () => void; lang: 'ru'|'en';
}) {
  return (
    <Card onClick={onFlip} padding={0} className={`word-card${flipped?' is-flipped':''}`}>
      <div className="word-card__word">
        {flipped ? word.ru : word.en}
      </div>
      <div className="word-card__phonetic">{word.phonetic}</div>
      <div className="word-card__hint">{lang==='ru'?'Нажми, чтобы перевернуть':'Tap to flip'}</div>
    </Card>
  );
}
