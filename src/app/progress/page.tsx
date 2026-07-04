// @ts-nocheck
'use client';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

const C={rose:'#e91e63',sage:'#5b8c5a',gold:'#f59e0b',warm:'#78716c',dark:'#44403c'};

export default function ProgressPage() {
  const {t,lang}=useI18n(); const router=useRouter();
  const stats=[{l:lang==='ru'?'Уроков':'Lessons',v:12,c:C.sage},{l:lang==='ru'?'Слов':'Words',v:34,c:C.rose},{l:lang==='ru'?'Часов':'Hours',v:2.5,c:C.gold},{l:lang==='ru'?'Дней подряд':'Day streak',v:5,c:'#f59e0b'}];
  return (
    <div style={{minHeight:'100vh',background:'#fef9f4',fontFamily:"'Nunito','Inter',sans-serif"}}>
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',justifyContent:'space-between'}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span><LangToggle/>
      </div>
      <div style={{maxWidth:500,margin:'0 auto',padding:'24px 20px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,color:C.dark}}>{t('progress_title')}</h1>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:16}}>
          {stats.map((s,i)=>(
            <div key={i} style={{background:'white',borderRadius:16,padding:'20px',textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
              <div style={{fontSize:'2.2rem',fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:'0.85rem',color:C.warm}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
