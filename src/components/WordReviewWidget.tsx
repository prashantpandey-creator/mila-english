// @ts-nocheck
'use client';

import MilaIcon from '@/components/ui/MilaIcon';

export default function WordReviewWidget({ known, total, lang, onForgot, onKnow }: {
  known: number; total: number; lang: 'ru'|'en'; onForgot: () => void; onKnow: () => void;
}) {
  return (
    <div className="word-review">
      <div className="word-review__progress">
        <span>{known}/{total} {lang==='ru'?'выучено':'learned'}</span>
      </div>
      <div className="word-review__actions">
        <button className="product-button product-button--secondary" onClick={onForgot}>
          {lang==='ru'?'Забыл(а)':'Forgot'}
        </button>
        <button className="product-button product-button--primary" onClick={onKnow}>
          {lang==='ru'?'Помню':'Know it'} <MilaIcon name="practice" size={17}/>
        </button>
      </div>
    </div>
  );
}
