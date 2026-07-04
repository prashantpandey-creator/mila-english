// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

const C={rose:'#e91e63',roseL:'#fce4ec',sage:'#5b8c5a',sageL:'#e8f5e9',gold:'#f59e0b',goldL:'#fef3c7',warm:'#78716c',dark:'#44403c'};

const WORDS_RU = [
  {en:'hello',ru:'привет',phonetic:'/həˈloʊ/'},{en:'goodbye',ru:'пока',phonetic:'/ɡʊdˈbaɪ/'},
  {en:'please',ru:'пожалуйста',phonetic:'/pliːz/'},{en:'thank you',ru:'спасибо',phonetic:'/θæŋk juː/'},
  {en:'sorry',ru:'извините',phonetic:'/ˈsɒri/'},{en:'yes',ru:'да',phonetic:'/jes/'},
  {en:'no',ru:'нет',phonetic:'/noʊ/'},{en:'maybe',ru:'может быть',phonetic:'/ˈmeɪbi/'},
  {en:'beautiful',ru:'красивый',phonetic:'/ˈbjuːtɪfəl/'},{en:'delicious',ru:'вкусный',phonetic:'/dɪˈlɪʃəs/'},
  {en:'important',ru:'важный',phonetic:'/ɪmˈpɔːrtənt/'},{en:'comfortable',ru:'удобный',phonetic:'/ˈkʌmftəbəl/'},
];

export default function VocabPage() {
  const { t, lang } = useI18n(); const router = useRouter();
  const [idx, setIdx] = useState(0); const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  const w = lang==='ru' ? WORDS_RU[idx] : WORDS_RU[idx];
  const speak = (t: string) => { const u = new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.7; speechSynthesis.speak(u); };
  
  const next = (knew: boolean) => {
    if(knew) setKnown([...known, idx]);
    if(idx < WORDS_RU.length-1) { setIdx(idx+1); setFlipped(false); }
    else setIdx(0);
  };

  return (
    <div style={{minHeight:'100vh',background:'#fef9f4',fontFamily:"'Nunito','Inter',sans-serif"}}>
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span>
        <LangToggle/>
      </div>
      <div style={{maxWidth:460,margin:'0 auto',padding:'32px 20px',textAlign:'center'}}>
        <div style={{marginBottom:8}}><span style={{fontSize:'0.85rem',color:C.warm}}>{known.length}/{WORDS_RU.length} {lang==='ru'?'выучено':'learned'}</span></div>
        
        {/* Flashcard */}
        <div onClick={()=>{setFlipped(!flipped);if(!flipped)speak(w.en);}}
          style={{cursor:'pointer',background:'white',borderRadius:24,minHeight:220,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,boxShadow:'0 4px 24px rgba(0,0,0,0.06)',marginBottom:20,transition:'all 0.3s',userSelect:'none'}}>
          <div style={{fontSize:flipped?'1.1rem':'2rem',fontWeight:flipped?500:700,color:flipped?C.warm:C.dark,marginBottom:8}}>
            {flipped ? w.ru : w.en}
          </div>
          {!flipped && <div style={{fontSize:'1rem',color:C.warm}}>{w.phonetic}</div>}
          {flipped && <div style={{fontSize:'1.2rem',color:C.rose,marginTop:4}}>{w.phonetic}</div>}
          <div style={{marginTop:12,fontSize:'0.8rem',color:C.warm}}>{lang==='ru'?'Нажми, чтобы перевернуть':'Tap to flip'}</div>
        </div>

        {/* Listen button */}
        <button onClick={()=>speak(w.en)}
          style={{padding:'12px 28px',borderRadius:14,border:'none',background:C.roseL,color:C.rose,fontWeight:600,cursor:'pointer',fontSize:'1rem',marginBottom:20}}>
          🔊 {lang==='ru'?'Прослушать':'Listen'}
        </button>

        {/* Know / Don't Know */}
        <div style={{display:'flex',gap:12}}>
          <button onClick={()=>next(false)} style={{flex:1,padding:'14px',borderRadius:14,border:'2px solid #e5e0dc',background:'white',color:C.warm,fontWeight:600,cursor:'pointer',fontSize:'1rem'}}>
            {lang==='ru'?'Забыл(а)':'Forgot'}
          </button>
          <button onClick={()=>next(true)} style={{flex:1,padding:'14px',borderRadius:14,border:'none',background:C.sage,color:'white',fontWeight:700,cursor:'pointer',fontSize:'1rem'}}>
            {lang==='ru'?'Помню ✅':'Know it ✅'}
          </button>
        </div>
      </div>
    </div>
  );
}
