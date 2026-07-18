// @ts-nocheck
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { Card } from '@/components/ui/Card';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import MilaIcon from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';

const QUESTIONS = [
  { sentence: 'She ___ from home.', options: ['works', 'work'], answer: 'works', ru: 'С he/she/it в настоящем времени добавляем -s.' },
  { sentence: '___ you call yesterday?', options: ['Did', 'Do'], answer: 'Did', ru: 'Yesterday указывает на прошлое: используем Did.' },
  { sentence: 'I ___ see you tomorrow.', options: ['will', 'did'], answer: 'will', ru: 'Tomorrow указывает на будущее: используем will.' },
  { sentence: 'He ___ coffee every morning.', options: ['drinks', 'drink'], answer: 'drinks', ru: 'С he в настоящем времени: drinks.' },
  { sentence: 'I would like ___ tea.', options: ['some', 'any'], answer: 'some', ru: 'В вежливой просьбе обычно используем some.' },
];

export default function GrammarPage() {
  const { lang } = useI18n();
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const question = QUESTIONS[index];

  const choose = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === question.answer) setCorrect(value => value + 1);
  };

  const advance = () => {
    if (index < QUESTIONS.length - 1) {
      setIndex(value => value + 1);
      setSelected(null);
      return;
    }
    const finalCorrect = correct + (selected === question.answer ? 0 : 0);
    const score = Math.round((finalCorrect / QUESTIONS.length) * 100);
    setDone(true);
    if (!saved) {
      setSaved(true);
      fetch('/api/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ builtinId: 'grammar-basics', score, completed: true, timeSpentSeconds: Math.round((Date.now() - startedAt.current) / 1000) }),
      }).catch(()=>{});
    }
  };

  const restart = () => { setIndex(0); setSelected(null); setCorrect(0); setDone(false); setSaved(false); startedAt.current = Date.now(); };
  const score = Math.round((correct / QUESTIONS.length) * 100);

  return (
    <AppShell className="welcome-page grammar-page">
      <AppHeader
        className="grammar-page__header"
        eyebrow={lang==='ru'?'Грамматика в речи':'Grammar in conversation'}
        title={lang==='ru'?'Выбери естественную фразу':'Choose the natural phrase'}
        actions={<LangToggle/>}
      />
      <AppMain width="compact" className="grammar-page__main">
        <div className="product-intro">
          <p className="product-intro__kicker">{lang==='ru'?'Грамматика на слух':'Grammar by instinct'}</p>
          <p className="product-intro__copy">{lang==='ru'?'Пять коротких примеров — без сухой теории.':'Five short examples, without dry theory.'}</p>
        </div>

        {!done ? <>
          <div className="quiz-progress" aria-label={`${index+1} / ${QUESTIONS.length}`}>{QUESTIONS.map((_,i)=><div key={i} className={i<=index?'is-filled':''}/>)}</div>
          <Card hover={false} padding="0" className="quiz-card">
            <div className="quiz-card__count">{String(index+1).padStart(2,'0')} / {String(QUESTIONS.length).padStart(2,'0')}</div>
            <div className="quiz-card__question">{question.sentence}</div>
            <div className="quiz-card__options">{question.options.map(option=>{
              const isRight=selected && option===question.answer;
              const isWrong=selected===option && option!==question.answer;
              return <button className={`quiz-option${isRight?' is-correct':''}${isWrong?' is-wrong':''}`} key={option} onClick={()=>choose(option)} disabled={Boolean(selected)}>{isRight?<MilaIcon name="practice" size={17}/>:isWrong?<MilaIcon name="target" size={17}/>:null}<span>{option}</span></button>;
            })}</div>
          </Card>
          {selected && <Card hover={false} padding="0" className={`quiz-feedback ${selected===question.answer?'is-correct':'is-wrong'}`}>
            <div className="quiz-feedback__title">{selected===question.answer?(lang==='ru'?'Отлично — звучит естественно.':'Exactly — that sounds natural.'):(lang==='ru'?'Хорошая попытка. Посмотри на подсказку.':'Good try. Use this clue.')}</div>
            <div className="quiz-feedback__copy">{lang==='ru'?question.ru:`Correct: “${question.answer}”. ${question.ru}`}</div>
          </Card>}
          <button onClick={advance} disabled={!selected} className="product-button product-button--primary product-button--full">{index===QUESTIONS.length-1?(lang==='ru'?'Показать результат':'See result'):(lang==='ru'?'Продолжить →':'Continue →')}</button>
        </> : <Card hover={false} padding="0" className="quiz-complete">
          <div className="quiz-complete__icon"><MilaIcon name={score>=80?'trophy':'sparkle'} size={32}/></div>
          <h2>{lang==='ru'?'Практика завершена':'Practice complete'}</h2>
          <p>{lang==='ru'?`Верно: ${correct} из ${QUESTIONS.length} · ${score}%`:`Correct: ${correct} of ${QUESTIONS.length} · ${score}%`}</p>
          <div className="product-actions"><button onClick={restart} className="product-button product-button--secondary">{lang==='ru'?'Ещё раз':'Again'}</button><button onClick={()=>router.push('/dashboard')} className="product-button product-button--primary">{lang==='ru'?'Готово':'Done'}</button></div>
        </Card>}
      </AppMain>
    </AppShell>
  );
}
