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
import { Card, IconTile } from '@/components/ui/Card';
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
        <div onClick={()=>router.push('/')} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:9}}>
          <div style={{width:30,height:30,borderRadius:'50%',border:'1px solid rgba(212,175,55,0.6)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:'1.05rem',color:'#e8cd7a'}}>M</div>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.25rem',color:C.dark}}>Mila</span>
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
          <Card hover={false} padding="24px" style={{ marginBottom: 24 }}>
            <div style={{fontSize:'1.8rem',marginBottom:8}}>✨</div>
            <h2 style={{fontSize:'1.5rem',margin:'0 0 6px',color:C.dark}}>{lang==='ru'?'Твой личный план обучения':'Your custom learning plan'}</h2>
            <p style={{fontSize:'0.9rem',lineHeight:1.55,margin:'0 0 16px',color:C.warm}}>{lang==='ru'?'Пройди короткое собеседование с ИИ, чтобы мы определили твой уровень и составили персональную программу.':'Take a short conversation with our AI to place your level and tailor a personal curriculum.'}</p>
            <button onClick={()=>router.push('/assessment')}
              style={{width:'100%',padding:'13px',borderRadius:12,border:'none',
                background:'linear-gradient(135deg,#e8b96a,#d4af37)',color:'#17130a',fontWeight:800,fontSize:'1rem',
                cursor:'pointer',boxShadow:'0 6px 22px rgba(212,175,55,0.3)'}}>
              {lang==='ru'?'Начать собеседование →':'Start assessment →'}
            </button>
          </Card>
        )}

        {/* Custom Plan Display (If generated) */}
        {user?.level !== 'pending' && user?.learnerProfile && (()=>{
          let plan: any = null;
          try { plan = JSON.parse(user.learnerProfile); } catch { plan = null; }
          return (
          <Card hover={false} padding="20px" style={{ marginBottom: 24 }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{fontSize:'0.72rem',fontWeight:700,color:C.gold,textTransform:'uppercase',letterSpacing:1.5,marginBottom:4}}>
                  {lang==='ru'?'Персональный план':'Custom plan'}
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.35rem',color:C.dark}}>Level {user.level.toUpperCase()}</div>
              </div>
              <IconTile size={44}>{user.level.slice(0,2).toUpperCase()}</IconTile>
            </div>
            <p style={{fontSize:'0.85rem',color:C.warm,lineHeight:1.55,margin:0}}>
              {plan?.weak_summary || (lang==='ru'?'Мы составили план на основе твоего собеседования.':'We built this plan from your assessment.')}
            </p>
          </Card>
          );
        })()}

        {/* Voice Lounge — the hero, in the house language: gold ember on glass */}
        <Card onClick={()=>router.push('/darshan')} padding={0} style={{ position:'relative', height:184, overflow:'hidden', marginBottom:16 }}>
          {/* single warm ember — one gold glow, no rainbow orb */}
          <div style={{position:'absolute',top:'-10%',right:'-6%',width:280,height:280,borderRadius:'50%',
            background:'radial-gradient(circle, rgba(212,175,55,0.30), rgba(232,85,109,0.12) 45%, transparent 70%)',
            filter:'blur(24px)'}}/>
          <div className="animate-spin-slow" style={{position:'absolute',top:'26%',left:'50%',transform:'translate(-50%,-50%)',
            width:120,height:120,borderRadius:'50%',
            background:'conic-gradient(from 0deg, rgba(212,175,55,0.55), rgba(232,85,109,0.35), rgba(212,175,55,0.55))',
            filter:'blur(18px)',opacity:0.7}}/>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:'22px 24px'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.6rem',color:C.dark,lineHeight:1.05}}>
              {lang==='ru'?'Голосовая гостиная':'The Voice Lounge'}
            </div>
            <div style={{fontSize:'0.88rem',color:C.warm,marginTop:5}}>
              {lang==='ru'?'Говори с Милой вслух — она ответит':'Speak with Mila aloud — she answers'}
            </div>
          </div>
        </Card>

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
        <Card hover={false} padding="20px 24px" style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{fontWeight:700,fontSize:'1rem',color:C.dark,marginBottom:4}}>🎤 {lang==='ru'?'Произношение':'Pronunciation'}</div>
          <p style={{fontSize:'0.85rem',color:C.warm,margin:'0 0 14px'}}>{lang==='ru'?'Нажми и послушай':'Tap to listen'}</p>
          <div style={{display:'flex',justifyContent:'center',gap:20}}>
            {['hello','world','thank you'].map(w=>(
              <PronunciationButton key={w} word={w}/>
            ))}
          </div>
        </Card>

        {/* Quick links — one uniform gold icon tile, no per-card rainbow */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          {[
            {emoji:'📚',label:lang==='ru'?'Уроки':'Lessons',sub:lang==='ru'?'По темам':'By topic',href:'/lessons'},
            {emoji:'📊',label:lang==='ru'?'Прогресс':'Progress',sub:lang==='ru'?'Статистика':'Stats',href:'/progress'},
            {emoji:'📖',label:lang==='ru'?'Словарь':'Vocabulary',sub:lang==='ru'?'Повторение':'Review',href:'/vocabulary'},
            {emoji:'🏆',label:lang==='ru'?'Успехи':'Badges',sub:lang==='ru'?'Награды':'Achievements',href:'/achievements'},
            {emoji:'🔤',label:lang==='ru'?'Фонетика':'Phonetics',sub:lang==='ru'?'Звуки':'Sounds',href:'/phonetics'},
            {emoji:'🎯',label:lang==='ru'?'Тест':'Assessment',sub:lang==='ru'?'Твой уровень':'Your level',href:'/assessment'},
            {emoji:'🤖',label:lang==='ru'?'ИИ Чат':'AI Chat',sub:lang==='ru'?'Общение':'Converse',href:'/chat'},
          ].map((l,i)=>(
            <Card key={i} onClick={()=>router.push(l.href)} padding="14px" style={{ display:'flex', alignItems:'center', gap:12 }}>
              <IconTile size={40}>{l.emoji}</IconTile>
              <div><div style={{fontWeight:600,fontSize:'0.95rem',color:C.dark}}>{l.label}</div><div style={{fontSize:'0.8rem',color:C.warm}}>{l.sub}</div></div>
            </Card>
          ))}
        </div>

        <LeaderboardCard lang={lang}/>
      </div>
    </div>
  );
}
