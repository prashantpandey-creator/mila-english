// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import StreakCounter from '@/components/StreakCounter';
import ProgressSummary from '@/components/ProgressSummary';
import PronunciationButton from '@/components/PronunciationButton';
import LeaderboardCard from '@/components/LeaderboardCard';
import { Card, IconTile } from '@/components/ui/Card';
import LearningJourneyCard from '@/components/LearningJourneyCard';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
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
    if (h < 12) return lang==='ru' ? 'Доброе утро' : 'Good morning';
    if (h < 17) return lang==='ru' ? 'Добрый день' : 'Good afternoon';
    return lang==='ru' ? 'Добрый вечер' : 'Good evening';
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
    <div className="welcome-dashboard" style={{minHeight:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      {/* Top Bar */}
      <div className="welcome-toolbar" style={{background:C.navBg,backdropFilter:'blur(18px)',padding:'10px 20px',
        borderBottom:`1px solid ${C.line}`,position:'sticky',top:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div onClick={()=>router.push('/')} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:9}}>
          <div className="welcome-brand-mark" style={{width:30,height:30,borderRadius:10,border:'1px solid rgba(242,139,173,0.48)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"var(--font-display, 'Manrope'),sans-serif",fontWeight:750,fontSize:'1rem',color:C.mercuryBright,
            background:'linear-gradient(145deg,rgba(36,211,154,.11),rgba(242,139,173,.08))',
            boxShadow:'0 0 22px rgba(242,139,173,.08)'}}>M</div>
          <span style={{fontFamily:"var(--font-display, 'Manrope'),sans-serif",fontWeight:700,fontSize:'1.18rem',letterSpacing:'-0.03em',color:C.dark}}>Mila</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <LangToggle />
          <button className="welcome-toolbar__quiet" onClick={handleLogout}
            style={{padding:'6px 14px',borderRadius:12,border:'1.5px solid var(--surface-control-line, rgba(255,255,255,.2))',background:'var(--surface-control, rgba(255,255,255,.025))',color:C.warm,
              fontWeight:600,fontSize:'0.8rem',cursor:'pointer'}}>
            {lang==='ru'?'Выйти':'Sign Out'}
          </button>
          <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${C.mercury},#0a7d5c)`,
            display:'flex',alignItems:'center',justifyContent:'center',color:'#03150e',fontWeight:800,fontSize:'0.8rem',
            boxShadow:'0 0 18px rgba(36,211,154,.16)'}}>
            {user?.name ? user.name[0].toUpperCase() : (lang==='ru'?'Г':'G')}
          </div>
        </div>
      </div>

      <div style={{maxWidth:560,margin:'0 auto',padding:'28px 20px'}}>
        {/* Greeting */}
        <div style={{marginBottom:24}}>
          <h1 style={{display:'flex',alignItems:'center',gap:9,fontSize:'1.6rem',fontWeight:800,margin:0,color:C.dark}}>
            {getGreeting()} <span style={{display:'grid',color:C.venus}}><MilaIcon name="sparkle" size={22}/></span>
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
            <div style={{width:34,height:34,display:'grid',placeItems:'center',marginBottom:8,color:C.jupiter}}><MilaIcon name="sparkle" size={28}/></div>
            <h2 style={{fontSize:'1.5rem',margin:'0 0 6px',color:C.dark}}>{lang==='ru'?'Твой личный план обучения':'Your custom learning plan'}</h2>
            <p style={{fontSize:'0.9rem',lineHeight:1.55,margin:'0 0 16px',color:C.warm}}>{lang==='ru'?'Пройди надёжный тест через сервер Mila — без внешнего ИИ. Голосовой вариант доступен там, где его поддерживает провайдер.':'Take the reliable Mila-only test with no external AI. Voice remains available where the provider supports it.'}</p>
            <button onClick={()=>router.push('/assessment')}
              style={{width:'100%',padding:'13px',borderRadius:12,border:'none',
                background:`linear-gradient(135deg,${C.mercuryBright},${C.mercury})`,color:'#032018',fontWeight:800,fontSize:'1rem',
                cursor:'pointer',boxShadow:'0 10px 30px rgba(36,211,154,0.22)'}}>
              {lang==='ru'?'Проверить уровень →':'Check my level →'}
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
                <div style={{fontSize:'0.72rem',fontWeight:700,color:C.jupiter,textTransform:'uppercase',letterSpacing:1.5,marginBottom:4}}>
                  {lang==='ru'?'Персональный план':'Custom plan'}
                </div>
                <div style={{fontFamily:"var(--font-display, 'Manrope'),sans-serif",fontWeight:700,fontSize:'1.3rem',letterSpacing:'-0.03em',color:C.dark}}>Level {user.level.toUpperCase()}</div>
              </div>
              <IconTile size={44}>{user.level.slice(0,2).toUpperCase()}</IconTile>
            </div>
            <p style={{fontSize:'0.85rem',color:C.warm,lineHeight:1.55,margin:0}}>
              {plan?.weak_summary || (lang==='ru'?'Мы составили план на основе твоего собеседования.':'We built this plan from your assessment.')}
            </p>
          </Card>
          );
        })()}

        {/* Mary Stage 1: five simple, functioning learner journeys. */}
        <h2 style={{fontSize:'1.05rem',color:C.dark,margin:'0 0 10px'}}>{lang==='ru'?'Что будем делать?':'What shall we do?'}</h2>
        <div className="journey-stack">
          {[
            {kind:'level' as const,ru:'Определить уровень',en:'Level check',ruSub:'Короткая голосовая проверка',enSub:'A short voice check',href:'/assessment'},
            {kind:'listening' as const,ru:'Аудирование',en:'Listening',ruSub:'Слушай, различай и повторяй',enSub:'Hear, notice and repeat',href:'/listen'},
            {kind:'vocabulary' as const,ru:'Новые слова',en:'New words',ruSub:'Личные сохранённые повторения',enSub:'Personal saved reviews',href:'/vocabulary'},
            {kind:'tutor' as const,ru:'ИИ-наставник',en:'AI tutor',ruSub:'Живая практика с Милой',enSub:'Live practice with Mila',href:'/chat'},
            {kind:'grammar' as const,ru:'Грамматика',en:'Grammar',ruSub:'Практика без сухих правил',enSub:'Patterns without dry rules',href:'/grammar'},
          ].map((item)=>(
            <LearningJourneyCard
              key={item.href}
              kind={item.kind}
              title={lang==='ru'?item.ru:item.en}
              subtitle={lang==='ru'?item.ruSub:item.enSub}
              onClick={()=>router.push(item.href)}
            />
          ))}
        </div>

        {/* Stats */}
        <div style={{marginBottom:20}}>
          <ProgressSummary items={[
            {icon:'lesson',val:stats?.completedLessons ?? '…',label:lang==='ru'?'Уроков пройдено':'Lessons done',color:C.jupiter},
            {icon:'time',val:stats ? Math.round(stats.totalTimeSeconds/60) : '…',label:lang==='ru'?'Минут':'Minutes',color:C.voice},
          ]}/>
        </div>

        {/* Pronunciation */}
        <Card hover={false} padding="20px 24px" style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontWeight:700,fontSize:'1rem',color:C.dark,marginBottom:4}}><span style={{display:'grid',color:C.voice}}><MilaIcon name="pronunciation" size={18}/></span>{lang==='ru'?'Произношение':'Pronunciation'}</div>
          <p style={{fontSize:'0.85rem',color:C.warm,margin:'0 0 14px'}}>{lang==='ru'?'Нажми и послушай':'Tap to listen'}</p>
          <div style={{display:'flex',justifyContent:'center',gap:20}}>
            {['hello','world','thank you'].map(w=>(
              <PronunciationButton key={w} word={w}/>
            ))}
          </div>
        </Card>

        {/* Secondary tools */}
        <div className="secondary-tools-grid" style={{display:'grid',gap:10,marginBottom:20}}>
          {[
            {icon:'lessons' as MilaIconName,label:lang==='ru'?'Уроки':'Lessons',sub:lang==='ru'?'По темам':'By topic',href:'/lessons',tone:C.jupiter},
            {icon:'progress' as MilaIconName,label:lang==='ru'?'Прогресс':'Progress',sub:lang==='ru'?'Статистика':'Stats',href:'/progress',tone:C.mercury},
            {icon:'badges' as MilaIconName,label:lang==='ru'?'Успехи':'Badges',sub:lang==='ru'?'Награды':'Achievements',href:'/achievements',tone:C.jupiter},
            {icon:'phonetics' as MilaIconName,label:lang==='ru'?'Фонетика':'Phonetics',sub:lang==='ru'?'Звуки':'Sounds',href:'/phonetics',tone:C.voice},
            {icon:'voice' as MilaIconName,label:lang==='ru'?'Практика':'Speaking practice',sub:lang==='ru'?'Голосом, по уроку':'By voice, lesson-focused',href:'/practice',tone:C.voice},
          ].map((l,i)=>(
            <Card key={i} onClick={()=>router.push(l.href)} padding="14px" style={{ display:'flex', alignItems:'center', gap:12 }}>
              <IconTile size={40}><span style={{display:'grid',color:l.tone}}><MilaIcon name={l.icon} size={20}/></span></IconTile>
              <div><div style={{fontWeight:600,fontSize:'0.95rem',color:C.dark}}>{l.label}</div><div style={{fontSize:'0.8rem',color:C.warm}}>{l.sub}</div></div>
            </Card>
          ))}
        </div>

        <LeaderboardCard lang={lang} stats={stats}/>
      </div>
    </div>
  );
}
