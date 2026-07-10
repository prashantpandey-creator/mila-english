// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

export default function LoginPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
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

  const inputStyle = {width:'100%',padding:'0.75rem 1rem',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.14)',fontSize:'0.95rem',outline:'none',background:'rgba(255,255,255,0.07)',color:'#f2ede3'};
  const btnStyle = {width:'100%',padding:'0.85rem',borderRadius:10,border:'none',background:'linear-gradient(135deg,#e8869a,#e8556d)',color:'white',fontWeight:600,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 14px rgba(233,30,99,0.25)'};

  return (
    <div style={{minHeight:'100vh',background:'transparent'}}>
      <nav style={{background:'rgba(13,16,23,0.72)',backdropFilter:'blur(12px)',padding:'0.75rem 1.5rem',borderBottom:'1px solid rgba(212,175,55,0.18)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{display:'flex',alignItems:'center',gap:9}}><span style={{width:30,height:30,borderRadius:'50%',border:'1px solid rgba(212,175,55,0.6)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:'1.05rem',color:'#e8cd7a'}}>M</span><span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.3rem',color:'#f2ede3'}}>Mila</span></span>
          <LangToggle />
        </div>
      </nav>
      <main style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'calc(100vh - 60px)',padding:'1rem'}}>
        <div style={{width:'100%',maxWidth:420,background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:20,padding:'2.5rem 2rem',boxShadow:'0 8px 40px rgba(0,0,0,0.5)'}}>
          <div style={{textAlign:'center',marginBottom:'2rem'}}>
            <div style={{fontSize:'3rem'}}>🌸</div>
            <h1 style={{fontSize:'1.5rem',fontWeight:800,margin:'0.5rem 0 0',color:'#f2ede3'}}>{t('login_title')}</h1>
            <p style={{color:'#a89f8d',marginTop:'0.25rem'}}>{t('login_subtitle')}</p>
          </div>
          <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {error && <div style={{padding:'0.75rem',borderRadius:10,background:'rgba(232,85,109,0.16)',color:'#e8556d',fontSize:'0.9rem',textAlign:'center'}}>{error}</div>}
            <div><label style={{fontSize:'0.9rem',fontWeight:500,color:'#f2ede3'}}>{t('login_email')}</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} placeholder="anna@example.com" required /></div>
            <div><label style={{fontSize:'0.9rem',fontWeight:500,color:'#f2ede3'}}>{t('login_password')}</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" required /></div>
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? '...' : t('login_btn')}</button>
            <div style={{textAlign:'center',color:'#a89f8d',fontSize:'0.85rem',margin:'0.25rem 0'}}>{lang==='ru'?'или':'or'}</div>
            <button type="button" onClick={handleGuestLogin} disabled={loading}
              style={{...btnStyle, background:'linear-gradient(135deg,#a8d5ba,#5b8c5a)', boxShadow:'0 4px 14px rgba(91,140,90,0.25)'}}>
              {lang==='ru'?'Войти как гость 🌸':'Try as Guest 🌸'}
            </button>
          </form>
          <p style={{textAlign:'center',marginTop:'1.5rem',color:'#a89f8d',fontSize:'0.9rem'}}>
            {t('login_no_account')} <a href="/register" style={{color:'#e8556d',fontWeight:600,textDecoration:'none'}}>{t('login_create')}</a></p>
        </div>
      </main>
    </div>
  );
}
