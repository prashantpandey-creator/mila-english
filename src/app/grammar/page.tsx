// @ts-nocheck
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { Card } from '@/components/ui/Card';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import MilaIcon from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

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
        <p style={{color:C.warm,margin:'0 0 20px'}}>{lang==='ru'?'Пять коротких примеров — без сухой теории.':'Five short examples, without dry theory.'}</p>

        {!done ? <>
          <div style={{display:'flex',gap:5,marginBottom:18}}>{QUESTIONS.map((_,i)=><div key={i} style={{flex:1,height:5,borderRadius:4,background:i<=index?C.mercury:'rgba(255,255,255,0.12)'}}/>)}</div>
          <Card hover={false} padding="24px" style={{marginBottom:14}}>
            <div style={{fontSize:'0.78rem',color:C.warm,marginBottom:10}}>{index+1} / {QUESTIONS.length}</div>
            <div style={{fontSize:'1.45rem',fontWeight:750,color:C.dark,marginBottom:20}}>{question.sentence}</div>
            <div style={{display:'grid',gap:10}}>{question.options.map(option=>{
              const isRight=selected && option===question.answer;
              const isWrong=selected===option && option!==question.answer;
              return <button key={option} onClick={()=>choose(option)} disabled={Boolean(selected)} style={{padding:'14px',borderRadius:13,border:`1.5px solid ${isRight?C.mercury:isWrong?C.rose:'rgba(255,255,255,0.14)'}`,background:isRight?C.mercuryL:isWrong?C.roseL:'rgba(255,255,255,0.05)',color:C.dark,fontSize:'1rem',fontWeight:700,cursor:selected?'default':'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:7}}>{isRight?<MilaIcon name="practice" size={17}/>:isWrong?<MilaIcon name="target" size={17}/>:null}{option}</button>;
            })}</div>
          </Card>
          {selected && <Card hover={false} padding="16px" style={{marginBottom:14,border:`1px solid ${selected===question.answer?C.mercury:C.rose}`}}>
            <div style={{fontWeight:750,color:selected===question.answer?C.mercury:C.rose,marginBottom:4}}>{selected===question.answer?(lang==='ru'?'Отлично — звучит естественно.':'Exactly — that sounds natural.'):(lang==='ru'?'Хорошая попытка. Посмотри на подсказку.':'Good try. Use this clue.')}</div>
            <div style={{color:C.warm,lineHeight:1.5}}>{lang==='ru'?question.ru:`Correct: “${question.answer}”. ${question.ru}`}</div>
          </Card>}
          <button onClick={advance} disabled={!selected} style={{width:'100%',padding:'15px',borderRadius:14,border:'none',background:selected?C.mercury:'rgba(255,255,255,0.08)',color:selected?C.white:C.warm,fontWeight:800,cursor:selected?'pointer':'default'}}>{index===QUESTIONS.length-1?(lang==='ru'?'Показать результат':'See result'):(lang==='ru'?'Продолжить →':'Continue →')}</button>
        </> : <Card hover={false} padding="28px" style={{textAlign:'center'}}>
          <div style={{width:68,height:68,display:'grid',placeItems:'center',margin:'0 auto',borderRadius:19,color:score>=80?C.jupiter:C.mercury,background:score>=80?C.jupiterL:C.mercuryL}}><MilaIcon name={score>=80?'trophy':'sparkle'} size={32}/></div>
          <h2 style={{color:C.dark,margin:'10px 0 5px'}}>{lang==='ru'?'Практика завершена':'Practice complete'}</h2>
          <p style={{color:C.jupiter,margin:'0 0 22px',fontWeight:700}}>{lang==='ru'?`Верно: ${correct} из ${QUESTIONS.length} · ${score}%`:`Correct: ${correct} of ${QUESTIONS.length} · ${score}%`}</p>
          <div style={{display:'flex',gap:10}}><button onClick={restart} style={{flex:1,padding:13,borderRadius:12,border:'1px solid rgba(255,255,255,.14)',background:'transparent',color:C.warm,fontWeight:700,cursor:'pointer'}}>{lang==='ru'?'Ещё раз':'Again'}</button><button onClick={()=>router.push('/dashboard')} style={{flex:1,padding:13,borderRadius:12,border:'none',background:C.mercury,color:C.white,fontWeight:800,cursor:'pointer'}}>{lang==='ru'?'Готово':'Done'}</button></div>
        </Card>}
      </AppMain>
    </AppShell>
  );
}
