// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';

export default function LoginPage() {
  const { t } = useI18n();
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
    } catch { setError(t('error_try_again')); }
    finally { setLoading(false); }
  };

  const inputStyle = {width:'100%',padding:'0.75rem 1rem',borderRadius:10,border:'1.5px solid #e5e0dc',fontSize:'0.95rem',outline:'none'};
  const btnStyle = {width:'100%',padding:'0.85rem',borderRadius:10,border:'none',background:'linear-gradient(135deg,#f9a8b8,#e91e63)',color:'white',fontWeight:600,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 14px rgba(233,30,99,0.25)'};

  return (
    <div style={{minHeight:'100vh',background:'#fff8f0'}}>
      <nav style={{background:'rgba(255,255,255,0.88)',backdropFilter:'blur(12px)',padding:'0.75rem 1.5rem',borderBottom:'1px solid rgba(249,168,184,0.12)'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:800,fontSize:'1.15rem',color:'#44403c'}}>🌸 Eng<span style={{color:'#e91e63'}}>Fluent</span></span>
          <LangToggle />
        </div>
      </nav>
      <main style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'calc(100vh - 60px)',padding:'1rem'}}>
        <div style={{width:'100%',maxWidth:420,background:'white',borderRadius:20,padding:'2.5rem 2rem',boxShadow:'0 8px 40px rgba(120,113,108,0.12)'}}>
          <div style={{textAlign:'center',marginBottom:'2rem'}}>
            <div style={{fontSize:'3rem'}}>🌸</div>
            <h1 style={{fontSize:'1.5rem',fontWeight:800,margin:'0.5rem 0 0',color:'#44403c'}}>{t('login_title')}</h1>
            <p style={{color:'#78716c',marginTop:'0.25rem'}}>{t('login_subtitle')}</p>
          </div>
          <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {error && <div style={{padding:'0.75rem',borderRadius:10,background:'#fce4ec',color:'#e91e63',fontSize:'0.9rem',textAlign:'center'}}>{error}</div>}
            <div><label style={{fontSize:'0.9rem',fontWeight:500,color:'#44403c'}}>{t('login_email')}</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} placeholder="anna@example.com" required /></div>
            <div><label style={{fontSize:'0.9rem',fontWeight:500,color:'#44403c'}}>{t('login_password')}</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" required /></div>
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? '...' : t('login_btn')}</button>
          </form>
          <p style={{textAlign:'center',marginTop:'1.5rem',color:'#78716c',fontSize:'0.9rem'}}>
            {t('login_no_account')} <a href="/register" style={{color:'#e91e63',fontWeight:600,textDecoration:'none'}}>{t('login_create')}</a></p>
        </div>
      </main>
    </div>
  );
}
