'use client';

import { useState } from 'react';
import { RELIABLE_ASSESSMENT_QUESTIONS, scoreReliableAssessment } from '@/lib/reliableAssessment';
import type { AssessmentResult } from '@/lib/assessment';
import { C } from '@/lib/theme';
import MilaIcon from '@/components/ui/MilaIcon';

type Props = {
  lang: 'ru' | 'en';
  busy: boolean;
  error: string;
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
};

export default function ReliableAssessment({ lang, busy, error, onComplete, onCancel }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const question = RELIABLE_ASSESSMENT_QUESTIONS[index];
  const selected = answers[index];
  const progress = ((index + 1) / RELIABLE_ASSESSMENT_QUESTIONS.length) * 100;

  const choose = (optionIndex: number) => {
    if (busy) return;
    setAnswers((current) => {
      const next = current.slice();
      next[index] = optionIndex;
      return next;
    });
  };

  const advance = () => {
    if (!Number.isInteger(selected) || busy) return;
    if (index < RELIABLE_ASSESSMENT_QUESTIONS.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    onComplete(scoreReliableAssessment(answers).result);
  };

  return (
    <div style={{width:'100%',maxWidth:560}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,fontSize:'0.78rem',color:C.warm}}>
        <button type="button" onClick={onCancel} disabled={busy}
          style={{border:'none',background:'transparent',color:C.warm,cursor:busy?'default':'pointer',padding:0}}>
          ← {lang === 'ru' ? 'Другой способ' : 'Other option'}
        </button>
        <span>{index + 1} / {RELIABLE_ASSESSMENT_QUESTIONS.length}</span>
      </div>

      <div style={{height:5,borderRadius:999,background:'rgba(255,255,255,0.09)',overflow:'hidden',marginBottom:26}}>
        <div style={{height:'100%',width:`${progress}%`,background:`linear-gradient(90deg,${C.mercury},${C.mercuryBright})`,transition:'width .25s ease'}} />
      </div>

      <div className="focus-card" style={{padding:'24px 20px',textAlign:'left'}}>
        <div style={{fontSize:'0.72rem',letterSpacing:'0.14em',textTransform:'uppercase',fontWeight:700,color:C.jupiter,marginBottom:9}}>
          {lang === 'ru' ? 'Надёжная проверка' : 'Reliable assessment'} · {question.level}
        </div>
        <h2 style={{fontSize:'1.35rem',lineHeight:1.35,color:C.dark,margin:'0 0 7px'}}>{question.prompt}</h2>
        <p style={{fontSize:'0.86rem',color:C.warm,margin:'0 0 20px',lineHeight:1.5}}>
          {lang === 'ru' ? question.promptRu : 'Choose the best answer.'}
        </p>

        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:9}} role="radiogroup" aria-label={question.prompt}>
          {question.options.map((option, optionIndex) => {
            const active = selected === optionIndex;
            return (
              <button key={option} type="button" role="radio" aria-checked={active} disabled={busy}
                onClick={() => choose(optionIndex)}
                style={{padding:'12px 14px',borderRadius:11,textAlign:'left',cursor:busy?'default':'pointer',fontSize:'0.92rem',lineHeight:1.4,
                  border:active?`1.5px solid ${C.mercury}`:'1px solid rgba(255,255,255,0.13)',
                  background:active?C.mercuryL:'var(--focus-inset,rgba(255,255,255,.045))',color:C.dark}}>
                <span style={{display:'inline-grid',placeItems:'center',width:23,height:23,borderRadius:'50%',marginRight:10,
                  border:active?`1px solid ${C.mercury}`:'1px solid rgba(255,255,255,.2)',color:active?C.mercury:C.warm,fontSize:'0.72rem'}}>
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {error && (
          <div role="alert" style={{marginTop:14,padding:'10px 12px',borderRadius:10,background:C.roseL,color:C.rose,fontSize:'0.84rem'}}>{error}</div>
        )}

        <button type="button" disabled={!Number.isInteger(selected) || busy} onClick={advance}
          style={{width:'100%',marginTop:18,padding:'12px 16px',borderRadius:11,border:'none',fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:7,
            background:Number.isInteger(selected)&&!busy?`linear-gradient(135deg,${C.mercuryBright},${C.mercury})`:'rgba(255,255,255,.11)',
            color:Number.isInteger(selected)&&!busy?C.white:'#746f66',cursor:Number.isInteger(selected)&&!busy?'pointer':'default'}}>
          {busy
            ? (lang === 'ru' ? 'Сохраняю результат…' : 'Saving result…')
            : index === RELIABLE_ASSESSMENT_QUESTIONS.length - 1
              ? (lang === 'ru' ? 'Узнать уровень' : 'Get my level')
              : (lang === 'ru' ? 'Дальше' : 'Next')}
          {!busy && index < RELIABLE_ASSESSMENT_QUESTIONS.length - 1 && <MilaIcon name="arrow" size={16}/>}
        </button>
      </div>

      <p style={{margin:'15px auto 0',fontSize:'0.75rem',lineHeight:1.5,color:'#8b8373',maxWidth:440,textAlign:'center'}}>
        {lang === 'ru'
          ? 'Не обращается к внешнему ИИ. Ответы остаются в браузере; на сервер Mila отправляется только итог.'
          : 'No external AI calls. Answers stay in the browser; only the final result is saved to Mila.'}
      </p>
    </div>
  );
}
