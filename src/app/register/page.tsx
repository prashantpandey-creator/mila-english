// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

export default function RegisterPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({name:'',email:'',password:'',nativeLanguage:'Русский',learnerCategory:'absolute_beginner'});
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const up = (f:string) => (e:any) => setForm(p=>({...p,[f]:e.target.value}));
  const inp = {width:'100%',padding:'0.7rem 1rem',borderRadius:10,border:'1.5px solid #e5e0dc',fontSize:'0.95rem',outline:'none'};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      if (!res.ok) throw new Error('');
      router.push('/dashboard');
      router.refresh();
    } catch { setError(t('error_try_again')); }
    finally { setLoading(false); }
  };

  const handleGuestLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      if (!res.ok) throw new Error('');
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError(t('error_try_again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',background:'#fff8f0'}}>
      <nav style={{background:'rgba(255,255,255,0.88)',backdropFilter:'blur(12px)',padding:'0.75rem 1.5rem',borderBottom:'1px solid rgba(249,168,184,0.12)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:800,fontSize:'1.15rem',color:'#44403c'}}>🌸 Eng<span style={{color:'#e91e63'}}>Fluent</span></span>
          <LangToggle />
        </div>
      </nav>
      <main style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'calc(100vh - 60px)',padding:'1rem'}}>
        <div style={{width:'100%',maxWidth:460,background:'white',borderRadius:20,padding:'2.5rem 2rem',boxShadow:'0 8px 40px rgba(120,113,108,0.12)'}}>
          <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
            <div style={{fontSize:'3rem'}}>🌷</div>
            <h1 style={{fontSize:'1.5rem',fontWeight:800,margin:'0.5rem 0 0',color:'#44403c'}}>{t('register_title')}</h1>
            <p style={{color:'#78716c',marginTop:'0.25rem'}}>{t('register_subtitle')}</p>
          </div>
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
            {error && <div style={{padding:'0.75rem',borderRadius:10,background:'#fce4ec',color:'#e91e63',fontSize:'0.9rem',textAlign:'center'}}>{error}</div>}
            {[{k:'name',l:'register_name',ph:'Анна'},{k:'email',l:'register_email',ph:'anna@email.com'},{k:'password',l:'register_password',ph:'••••••••'},{k:'nativeLanguage',l:'register_language',ph:'Русский'}].map(f=>(
              <div key={f.k}><label style={{fontSize:'0.9rem',fontWeight:500,color:'#44403c'}}>{t(f.l as any)}</label>
                <input type={f.k==='email'?'email':f.k==='password'?'password':'text'} value={(form as any)[f.k]} onChange={up(f.k)} placeholder={f.ph} style={inp} required /></div>
            ))}
            <div><label style={{fontSize:'0.9rem',fontWeight:500,color:'#44403c'}}>{t('register_level')}</label>
              <select value={form.learnerCategory} onChange={up('learnerCategory')} style={inp}>
                <option value="absolute_beginner">{t('register_level_beginner')}</option>
                <option value="young_learner">{t('register_level_young')}</option>
                <option value="adult_beginner">{t('register_level_adult')}</option>
                <option value="intermediate">{t('register_level_intermediate')}</option>
              </select></div>
            <button type="submit" disabled={loading} style={{width:'100%',padding:'0.85rem',borderRadius:10,border:'none',
              background:'linear-gradient(135deg,#a8d5ba,#5b8c5a)',color:'white',fontWeight:600,fontSize:'1rem',cursor:'pointer',
              boxShadow:'0 4px 14px rgba(91,140,90,0.25)',marginTop:'0.5rem'}}>{loading ? '...' : t('register_btn')}</button>
            <div style={{textAlign:'center',color:'#78716c',fontSize:'0.85rem',margin:'0.25rem 0'}}>{lang==='ru'?'или':'or'}</div>
            <button type="button" onClick={handleGuestLogin} disabled={loading}
              style={{width:'100%',padding:'0.85rem',borderRadius:10,border:'none',
                background:'linear-gradient(135deg,#f9a8b8,#e91e63)',color:'white',fontWeight:600,fontSize:'1rem',cursor:'pointer',
                boxShadow:'0 4px 14px rgba(233,30,99,0.25)'}}>
              {lang==='ru'?'Войти как гость 🌸':'Try as Guest 🌸'}
            </button>
          </form>
          <p style={{textAlign:'center',marginTop:'1.5rem',color:'#78716c',fontSize:'0.9rem'}}>
            {t('register_has_account')} <a href="/login" style={{color:'#5b8c5a',fontWeight:600,textDecoration:'none'}}>{t('register_login')}</a></p>
        </div>
      </main>
    </div>
  );
}
