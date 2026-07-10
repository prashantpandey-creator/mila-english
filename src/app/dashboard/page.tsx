// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import DailyLessonCard from '@/components/DailyLessonCard';
import StreakCounter from '@/components/StreakCounter';
import ProgressSummary from '@/components/ProgressSummary';
import PronunciationButton from '@/components/PronunciationButton';
import LeaderboardCard from '@/components/LeaderboardCard';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [m, setM] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<{completedLessons:number;totalTimeSeconds:number;avgScore:number}|null>(null);
  useEffect(()=>{
    setM(true);
    fetch('/api/users/me').then(r=>r.ok?r.json():null).then(d=>{if(d)setUser(d);}).catch(()=>{});
    fetch('/api/progress').then(r=>r.ok?r.json():null).then(d=>{if(d)setStats(d);}).catch(()=>{});
  },[]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return lang==='ru' ? 'Доброе утро ☀️' : 'Good morning ☀️';
    if (h < 17) return lang==='ru' ? 'Добрый день 🌤️' : 'Good afternoon 🌤️';
    if (h < 21) return lang==='ru' ? 'Добрый вечер 🌙' : 'Good evening 🌙';
    return lang==='ru' ? 'Добрый вечер 🌙' : 'Good evening 🌙';
  };
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    router.push('/');
    router.refresh();
  };

  if (!m) return null;

  return (
    <div style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      {/* Top Bar */}
      <div style={{background:'rgba(13,16,23,0.72)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',position:'sticky',top:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div onClick={()=>router.push('/')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>
          🌸 Мила
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <LangToggle />
          <button onClick={handleLogout}
            style={{padding:'6px 14px',borderRadius:12,border:`1.5px solid ${C.rose}`,background:'transparent',color:C.rose,
              fontWeight:600,fontSize:'0.8rem',cursor:'pointer'}}>
            {lang==='ru'?'Выйти':'Sign Out'}
          </button>
          <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${C.rose},#c13e58)`,
            display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'0.8rem'}}>
            {user?.name ? user.name[0].toUpperCase() : (lang==='ru'?'Г':'G')}
          </div>
        </div>
      </div>

      <div style={{maxWidth:560,margin:'0 auto',padding:'28px 20px'}}>
        {/* Greeting */}
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:'1.6rem',fontWeight:800,margin:0,color:C.dark}}>
            {getGreeting()}
          </h1>
          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:6}}>
            <p style={{color:C.warm,margin:0}}>
              {lang==='ru'?'Готова позаниматься?':'Ready to practice?'}
            </p>
            <StreakCounter days={user?.streakDays || 0} lang={lang} />
          </div>
        </div>

        {/* AI Assessment Banner (If pending) */}
        {user?.level === 'pending' && (
          <div style={{background:'linear-gradient(135deg,#c4b5fd,#a78bfa)',borderRadius:20,padding:'24px',boxShadow:'0 8px 32px rgba(168,85,247,0.2)',marginBottom:24,color:'white'}}>
            <div style={{fontSize:'1.8rem',marginBottom:8}}>🤖✨</div>
            <h2 style={{fontSize:'1.3rem',fontWeight:800,margin:'0 0 6px'}}>{lang==='ru'?'Твой личный план обучения':'Your Custom Learning Plan'}</h2>
            <p style={{fontSize:'0.9rem',opacity:0.9,lineHeight:1.5,margin:'0 0 16px'}}>{lang==='ru'?'Пройди короткое собеседование с ИИ, чтобы мы определили твой уровень и составили персональную программу.':'Take a quick conversational test with our AI to determine your level and generate a personalized curriculum.'}</p>
            <button onClick={()=>router.push('/assessment')}
              style={{width:'100%',padding:'12px',borderRadius:12,border:'none',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',color:'#a78bfa',fontWeight:700,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 14px rgba(0,0,0,0.1)'}}>
              {lang==='ru'?'Начать собеседование →':'Start Assessment →'}
            </button>
          </div>
        )}

        {/* Custom Plan Display (If generated) */}
        {user?.level !== 'pending' && user?.learnerProfile && (()=>{
          let plan: any = null;
          try { plan = JSON.parse(user.learnerProfile); } catch { plan = null; }
          return (
          <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:20,padding:'20px',boxShadow:'0 2px 16px rgba(0,0,0,0.45)',marginBottom:24,border:'1px solid rgba(168,85,247,0.15)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:'0.75rem',fontWeight:700,color:'#a78bfa',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>
                  {lang==='ru'?'Персональный план':'Custom Plan'}
                </div>
                <div style={{fontWeight:700,fontSize:'1.1rem',color:C.dark}}>Level: {user.level.toUpperCase()}</div>
              </div>
              <div style={{width:40,height:40,borderRadius:12,background:'rgba(167,139,250,0.16)',color:'#a78bfa',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',fontWeight:800}}>
                {user.level.slice(0,2).toUpperCase()}
              </div>
            </div>
            <p style={{fontSize:'0.85rem',color:C.warm,lineHeight:1.5,margin:0}}>
              {plan?.weak_summary || (lang==='ru'?'Мы составили план на основе твоего собеседования.':'We built this plan based on your assessment.')}
            </p>
          </div>
          );
        })()}

        {/* Voice Darshan hero — antigravity's WebGL orb experience */}
        <div onClick={()=>router.push('/darshan')}
          style={{cursor:'pointer',position:'relative',height:200,borderRadius:24,overflow:'hidden',
            background:'linear-gradient(135deg,#1a0b2e,#3a1c4a,#4a1d3d)',marginBottom:16,
            boxShadow:'0 8px 32px rgba(124,58,237,0.25)',display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:24,
            transition:'transform 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='none'}}>
          {/* CSS glow orb */}
          <div style={{position:'absolute',top:'30%',left:'50%',transform:'translate(-50%,-50%)',width:150,height:150}}>
            <div className="animate-spin-slow" style={{position:'absolute',inset:0,borderRadius:'50%',
              background:'conic-gradient(from 0deg,#ec4899,#a78bfa,#3b82f6,#ec4899)',filter:'blur(20px)',opacity:0.6}}/>
            <div style={{position:'absolute',inset:16,borderRadius:'50%',background:'rgba(255,255,255,0.1)',backdropFilter:'blur(4px)',border:'1px solid rgba(255,255,255,0.2)'}}/>
          </div>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{fontWeight:800,fontSize:'1.5rem',color:'white',lineHeight:1.1}}>
              {lang==='ru'?'Голосовой Даршан':'Voice Darshan'}
            </div>
            <div style={{fontSize:'0.9rem',color:'#e9d5ff',marginTop:4}}>
              {lang==='ru'?'Говори с Милой вслух — ИИ ответит':'Speak with Mila aloud — the AI answers'}
            </div>
          </div>
        </div>

        {/* Main CTA — the listen-and-repeat core loop */}
        <DailyLessonCard
          title={lang==='ru'?'Слушай и повторяй':'Listen & repeat'}
          subtitle={lang==='ru'?'Акценты • произношение • 5 мин':'Accents • pronunciation • 5 min'}
          onStart={()=>router.push('/listen')}
        />

        {/* Stats */}
        <div style={{marginBottom:20}}>
          <ProgressSummary items={[
            {emoji:'📝',val:stats?.completedLessons ?? '…',label:lang==='ru'?'Уроков пройдено':'Lessons done',color:C.sage},
            {emoji:'⭐',val:stats ? Math.round(stats.totalTimeSeconds/60) : '…',label:lang==='ru'?'Минут':'Minutes',color:C.rose},
          ]}/>
        </div>

        {/* Pronunciation */}
        <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:20,padding:'20px 24px',boxShadow:'0 1px 8px rgba(0,0,0,0.45)',marginBottom:16,textAlign:'center'}}>
          <div style={{fontWeight:700,fontSize:'1rem',color:C.dark,marginBottom:4}}>🎤 {lang==='ru'?'Произношение':'Pronunciation'}</div>
          <p style={{fontSize:'0.85rem',color:C.warm,margin:'0 0 14px'}}>{lang==='ru'?'Нажми и послушай':'Tap to listen'}</p>
          <div style={{display:'flex',justifyContent:'center',gap:20}}>
            {['hello','world','thank you'].map(w=>(
              <PronunciationButton key={w} word={w}/>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          {[
            {emoji:'📚',label:lang==='ru'?'Уроки':'Lessons',sub:lang==='ru'?'По темам':'By topic',href:'/lessons',color:C.sage},
            {emoji:'📊',label:lang==='ru'?'Прогресс':'Progress',sub:lang==='ru'?'Статистика':'Stats',href:'/progress',color:C.purple},
            {emoji:'📖',label:lang==='ru'?'Словарь':'Vocabulary',sub:lang==='ru'?'Повторение':'Review',href:'/vocabulary',color:C.gold},
            {emoji:'🏆',label:lang==='ru'?'Успехи':'Badges',sub:lang==='ru'?'Награды':'Achievements',href:'/achievements',color:C.rose},
            {emoji:'🔤',label:lang==='ru'?'Фонетика':'Phonetics',sub:lang==='ru'?'Звуки':'Sounds',href:'/phonetics',color:C.sage},
            {emoji:'🎯',label:lang==='ru'?'Тест':'Assessment',sub:lang==='ru'?'Твой уровень':'Your level',href:'/assessment',color:C.purple},
            {emoji:'🤖',label:lang==='ru'?'ИИ Чат':'AI Chat',sub:lang==='ru'?'Общение':'Converse',href:'/chat',color:C.rose},
          ].map((l,i)=>(
            <div key={i} onClick={()=>router.push(l.href)}
              style={{cursor:'pointer',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:16,padding:'16px',boxShadow:'0 1px 8px rgba(0,0,0,0.45)',
                display:'flex',alignItems:'center',gap:12,transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.55)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 1px 8px rgba(0,0,0,0.45)'}}>
              <div style={{width:40,height:40,borderRadius:12,background:l.color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem'}}>{l.emoji}</div>
              <div><div style={{fontWeight:600,fontSize:'0.95rem',color:C.dark}}>{l.label}</div><div style={{fontSize:'0.8rem',color:C.warm}}>{l.sub}</div></div>
            </div>
          ))}
        </div>

        <LeaderboardCard lang={lang}/>
      </div>
    </div>
  );
}
