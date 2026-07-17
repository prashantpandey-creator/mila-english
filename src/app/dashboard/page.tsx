// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import ThemeToggle from '@/components/ThemeToggle';
import StreakCounter from '@/components/StreakCounter';
import ProgressSummary from '@/components/ProgressSummary';
import PronunciationButton from '@/components/PronunciationButton';
import LeaderboardCard from '@/components/LeaderboardCard';
import { Card, IconTile } from '@/components/ui/Card';
import { AppHeader, AppMain, AppShell } from '@/components/ui/AppShell';
import LearningJourneyCard from '@/components/LearningJourneyCard';
import ShowcaseSlider from '@/components/ShowcaseSlider';
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
    <AppShell className="welcome-dashboard dashboard-page">
      <AppHeader
        backHref="/"
        className="dashboard-page__header"
        actions={<>
          <LangToggle />
          <ThemeToggle />
          <button className="welcome-toolbar__quiet" onClick={handleLogout}
            style={{padding:'6px 14px',borderRadius:12,border:'1.5px solid var(--surface-control-line, rgba(255,255,255,.2))',background:'var(--surface-control, rgba(255,255,255,.025))',color:C.warm,
              fontWeight:600,fontSize:'0.8rem',cursor:'pointer'}}>
            {lang==='ru'?'Выйти':'Sign Out'}
          </button>
          <div className="dashboard-page__avatar" style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${C.mercury},#0a7d5c)`,
            display:'flex',alignItems:'center',justifyContent:'center',color:'#03150e',fontWeight:800,fontSize:'0.8rem',
            boxShadow:'0 0 18px rgba(36,211,154,.16)'}}>
            {user?.name ? user.name[0].toUpperCase() : (lang==='ru'?'Г':'G')}
          </div>
        </>}
      />

      <AppMain width="work" className="dashboard-page__main">
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

        {/* Flagship: the live conversation is the front door, never a secondary tool. */}
        <style>{`
          .mila-hero-card {
            transition: transform .18s ease, box-shadow .18s ease;
            background: linear-gradient(150deg, rgba(242,139,173,.16), rgba(5,11,8,.9) 46%, rgba(106,220,245,.12));
          }
          html:not([data-mila-theme="dark"]) .mila-surface--welcome .mila-hero-card {
            background: linear-gradient(150deg, rgba(242,139,173,.22), rgba(255,250,252,.96) 46%, rgba(106,220,245,.16));
          }
          .mila-hero-card:active { transform: scale(.988); }
          @media (prefers-reduced-motion: no-preference) {
            .mila-hero-orb { animation: milaHeroBreathe 4.5s ease-in-out infinite; }
            .mila-hero-halo { animation: milaHeroSpin 9s linear infinite; }
            .mila-hero-bar { animation: milaHeroWave 1.35s ease-in-out infinite; }
            .mila-hero-dot { animation: milaHeroBreathe 2.2s ease-in-out infinite; }
          }
          @keyframes milaHeroBreathe { 0%,100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.05); opacity: 1; } }
          @keyframes milaHeroSpin { to { transform: rotate(360deg); } }
          @keyframes milaHeroWave { 0%,100% { transform: scaleY(.4); } 50% { transform: scaleY(1); } }
        `}</style>
        <section aria-label={lang==='ru'?'Поговорить с Милой':'Talk with Mila'} style={{marginBottom:24}}>
          <div className="mila-hero-card" onClick={()=>router.push('/darshan')}
            style={{position:'relative',overflow:'hidden',cursor:'pointer',borderRadius:22,padding:20,
              border:'1px solid rgba(242,139,173,0.32)',
              boxShadow:'0 18px 44px rgba(242,139,173,0.14), var(--surface-card-shadow, 0 2px 10px rgba(0,0,0,0.5))'}}>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
              <div aria-hidden style={{position:'relative',width:76,height:76,flexShrink:0}}>
                <span className="mila-hero-halo" style={{position:'absolute',inset:-7,borderRadius:'50%',
                  background:`conic-gradient(from 0deg, ${C.voice}00, ${C.voice}55, ${C.venus}55, ${C.voice}00)`,filter:'blur(6px)'}}/>
                <span className="mila-hero-orb" style={{position:'absolute',inset:0,borderRadius:'50%',
                  background:`radial-gradient(circle at 32% 30%, ${C.venusBright} 0%, ${C.venus} 34%, #7a2547 62%, #1a0a12 100%)`,
                  boxShadow:'0 0 34px rgba(242,139,173,0.35), inset 0 0 18px rgba(255,189,208,0.5)'}}/>
                <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                  {[13,21,16,10].map((h,i)=>(
                    <i key={i} className="mila-hero-bar" style={{width:3,height:h,borderRadius:2,background:'rgba(255,255,255,0.92)',animationDelay:`${i*-0.22}s`}}/>
                  ))}
                </span>
              </div>
              <div style={{minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:7,fontSize:'0.68rem',fontWeight:800,letterSpacing:1.6,color:'var(--voice-readable,var(--voice))',textTransform:'uppercase',marginBottom:5}}>
                  <span className="mila-hero-dot" style={{width:7,height:7,borderRadius:'50%',background:'var(--voice-readable,var(--voice))',boxShadow:'0 0 10px var(--voice-readable,var(--voice))'}}/>
                  {lang==='ru'?'Живой голос':'Live voice'}
                </div>
                <div style={{fontFamily:"var(--font-display, 'Manrope'),sans-serif",fontWeight:800,fontSize:'1.45rem',letterSpacing:'-0.03em',color:C.dark,lineHeight:1.15}}>
                  {lang==='ru'?'Поговори с Милой':'Talk with Mila'}
                </div>
                <p style={{margin:'6px 0 0',fontSize:'0.86rem',lineHeight:1.5,color:C.warm}}>
                  {lang==='ru'
                    ? 'Живой голосовой диалог. Просто начни говорить — Мила услышит и ответит.'
                    : 'A live voice conversation. Just start speaking—Mila listens and answers aloud.'}
                </p>
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="button" onClick={(e)=>{e.stopPropagation();router.push('/darshan');}}
                style={{flex:1.4,padding:'13px 16px',borderRadius:14,border:'none',
                  background:`linear-gradient(135deg,${C.mercuryBright},${C.mercury})`,color:'#032018',
                  fontWeight:800,fontSize:'0.95rem',cursor:'pointer',boxShadow:'0 10px 30px rgba(36,211,154,0.25)',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <MilaIcon name="voice" size={18}/>{lang==='ru'?'Начать разговор':'Start talking'}
              </button>
              <button type="button" onClick={(e)=>{e.stopPropagation();router.push('/chat');}}
                style={{flex:1,padding:'13px 16px',borderRadius:14,border:'1.5px solid rgba(242,139,173,0.4)',
                  background:'rgba(242,139,173,0.08)',color:'var(--venus-readable,var(--venus-bright))',fontWeight:700,fontSize:'0.9rem',cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
                <MilaIcon name="tutor" size={17}/>{lang==='ru'?'Текстом':'Text chat'}
              </button>
            </div>
          </div>
        </section>

        <ShowcaseSlider />

        {/* AI Assessment Banner (If pending) */}
        {user?.level === 'pending' && (
          <Card hover={false} padding="24px" style={{ marginBottom: 24 }}>
            <div style={{width:34,height:34,display:'grid',placeItems:'center',marginBottom:8,color:'var(--jupiter-readable,var(--jupiter))'}}><MilaIcon name="sparkle" size={28}/></div>
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
                <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--jupiter-readable,var(--jupiter))',textTransform:'uppercase',letterSpacing:1.5,marginBottom:4}}>
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
            {kind:'tutor' as const,ru:'Мила-наставница',en:'AI tutor',ruSub:'Текстовый чат с Милой',enSub:'Text chat with Mila',href:'/chat'},
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
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontWeight:700,fontSize:'1rem',color:C.dark,marginBottom:4}}><span style={{display:'grid',color:'var(--voice-readable,var(--voice))'}}><MilaIcon name="pronunciation" size={18}/></span>{lang==='ru'?'Произношение':'Pronunciation'}</div>
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
            {icon:'lessons' as MilaIconName,label:lang==='ru'?'Уроки':'Lessons',sub:lang==='ru'?'По темам':'By topic',href:'/lessons',tone:'var(--jupiter-readable,var(--jupiter))'},
            {icon:'progress' as MilaIconName,label:lang==='ru'?'Прогресс':'Progress',sub:lang==='ru'?'Статистика':'Stats',href:'/progress',tone:'var(--mercury-readable,var(--mercury))'},
            {icon:'badges' as MilaIconName,label:lang==='ru'?'Успехи':'Badges',sub:lang==='ru'?'Награды':'Achievements',href:'/achievements',tone:'var(--jupiter-readable,var(--jupiter))'},
            {icon:'phonetics' as MilaIconName,label:lang==='ru'?'Фонетика':'Phonetics',sub:lang==='ru'?'Звуки':'Sounds',href:'/phonetics',tone:'var(--voice-readable,var(--voice))'},
            {icon:'voice' as MilaIconName,label:lang==='ru'?'Практика':'Speaking practice',sub:lang==='ru'?'Голосом, по уроку':'By voice, lesson-focused',href:'/practice',tone:'var(--voice-readable,var(--voice))'},
          ].map((l,i)=>(
            <Card key={i} onClick={()=>router.push(l.href)} padding="14px" style={{ display:'flex', alignItems:'center', gap:12 }}>
              <IconTile size={40}><span style={{display:'grid',color:l.tone}}><MilaIcon name={l.icon} size={20}/></span></IconTile>
              <div><div style={{fontWeight:600,fontSize:'0.95rem',color:C.dark}}>{l.label}</div><div style={{fontSize:'0.8rem',color:C.warm}}>{l.sub}</div></div>
            </Card>
          ))}
        </div>

        <LeaderboardCard lang={lang} stats={stats}/>
      </AppMain>
    </AppShell>
  );
}
