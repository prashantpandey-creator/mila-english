// @ts-nocheck
'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import MilaVoiceMark from '@/components/ui/MilaVoiceMark';
import { useI18n } from '@/lib/i18n-provider';
import { safeReturnTo } from '@/lib/navigation';
import { isGiaHostname } from '@/lib/productHosts';

const welcomeTheme = {
  '--auth-ink': '#26131f',
  '--auth-muted': '#65535f',
  '--auth-pink': '#d9006c',
  '--auth-pink-deep': '#a40050',
  '--auth-pink-soft': '#ffe8f3',
  '--auth-cream': '#fff4fa',
  '--auth-line': '#f0c7da',
  '--auth-shadow': 'rgba(47, 27, 36, 0.12)',
  '--auth-danger': '#a40050',
} as CSSProperties;

export default function LoginPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [returnTo, setReturnTo] = useState('/dashboard');
  const [isGia, setIsGia] = useState(false);

  useEffect(() => {
    const nextIsGia = isGiaHostname(window.location.hostname);
    const requestedReturnTo = new URLSearchParams(window.location.search).get('returnTo');
    setReturnTo(safeReturnTo(requestedReturnTo, nextIsGia ? '/chat' : '/dashboard'));
    setIsGia(nextIsGia);
  }, []);

  const messageFor = (code?: string, fallback?: string) => {
    if (code === 'INVALID_CREDENTIALS') return lang === 'ru' ? 'Неверный email или пароль.' : 'That email or password is not correct.';
    if (code === 'INVALID_INPUT') return lang === 'ru' ? 'Проверь email и пароль.' : 'Check your email and password.';
    if (code === 'RATE_LIMITED') return lang === 'ru' ? 'Слишком много попыток. Попробуй позже.' : 'Too many attempts. Please try again later.';
    return fallback || t('error_try_again');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(messageFor(body?.code, body?.error));
      router.push(returnTo);
      router.refresh();
    } catch (nextError) { setError(nextError instanceof Error && nextError.message ? nextError.message : t('error_try_again')); }
    finally { setLoading(false); }
  };

  const handleGuestLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(messageFor(body?.code, body?.error));
      router.push(returnTo);
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error && nextError.message ? nextError.message : t('error_try_again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-auth welcome-auth--login" style={welcomeTheme}>
      <nav className="welcome-auth__nav">
        <div className="welcome-auth__nav-inner">
          <span className="welcome-auth__brand">
            <span className="welcome-auth__brand-mark">{isGia ? 'G' : 'M'}</span>
            <span className="welcome-auth__brand-name">{isGia ? 'Gia' : 'Mila'}</span>
          </span>
          <LangToggle />
        </div>
      </nav>
      <main className="welcome-auth__main">
        <div className="welcome-auth__card">
          <div className="welcome-auth__intro">
            <div className="welcome-auth__bloom" aria-hidden="true">
              <MilaVoiceMark size={52} />
            </div>
            <h1 className="welcome-auth__title">
              {isGia
                ? (lang === 'ru' ? 'Продолжить в Gia' : 'Continue to Gia')
                : t('login_title')}
            </h1>
            <p className="welcome-auth__subtitle">
              {isGia
                ? (lang === 'ru' ? 'Войди с аккаунтом Mila или продолжи как гость.' : 'Use your Mila account, or continue as a guest.')
                : t('login_subtitle')}
            </p>
          </div>
          <form onSubmit={handleLogin} className="welcome-auth__form">
            {error && <div className="welcome-auth__error" role="alert">{error}</div>}
            <div className="welcome-auth__field">
              <label className="welcome-auth__label" htmlFor="login-email">{t('login_email')}</label>
              <input id="login-email" name="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="welcome-auth__input" placeholder="anna@example.com" autoComplete="email" maxLength={254} required />
            </div>
            <div className="welcome-auth__field">
              <label className="welcome-auth__label" htmlFor="login-password">{t('login_password')}</label>
              <input id="login-password" name="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="welcome-auth__input" placeholder="••••••••" autoComplete="current-password" maxLength={128} required />
              <a href="/forgot-password" className="welcome-auth__field-link">{lang === 'ru' ? 'Забыли пароль?' : 'Forgot password?'}</a>
            </div>
            <button type="submit" disabled={loading} className="welcome-auth__button welcome-auth__button--primary">{loading ? '...' : t('login_btn')}</button>
            <div className="welcome-auth__separator">{lang==='ru'?'или':'or'}</div>
            <button type="button" onClick={handleGuestLogin} disabled={loading}
              className="welcome-auth__button welcome-auth__button--secondary">
              {lang==='ru'?'Продолжить как гость':'Continue as guest'}
            </button>
            <p className="welcome-auth__guest-note">
              {lang==='ru'
                ? 'Гостевой сеанс приватный: разговоры не сохраняются. Зарегистрируйся, чтобы сохранить прогресс и историю.'
                : 'A guest session is private: chats aren’t saved. Sign up to keep your progress and history.'}
            </p>
          </form>
          <p className="welcome-auth__footer">
            {t('login_no_account')} <a href={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="welcome-auth__link">{t('login_create')}</a>
          </p>
          <p className="welcome-auth__legal"><a href="/terms">{lang === 'ru' ? 'Условия' : 'Terms'}</a><span>·</span><a href="/privacy">{lang === 'ru' ? 'Конфиденциальность' : 'Privacy'}</a></p>
        </div>
      </main>
      <style jsx>{`
        .welcome-auth,
        .welcome-auth * { box-sizing: border-box; }
        .welcome-auth {
          min-height: 100vh;
          min-height: 100dvh;
          overflow-x: hidden;
          color: var(--auth-ink);
          background:
            radial-gradient(circle at 8% 8%, rgba(217,0,108, .12) 0, rgba(217,0,108, 0) 31rem),
            radial-gradient(circle at 92% 84%, rgba(255, 241, 245, .94) 0, rgba(255, 241, 245, 0) 33rem),
            linear-gradient(145deg, #fffcfe 0%, #ffffff 48%, #fff4fa 100%);
          position: relative;
          isolation: isolate;
        }
        .welcome-auth::before,
        .welcome-auth::after {
          content: '';
          position: absolute;
          z-index: -1;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(1px);
        }
        .welcome-auth::before {
          width: clamp(13rem, 28vw, 25rem);
          aspect-ratio: 1;
          top: 15%;
          right: -9rem;
          border: 1px solid rgba(217,0,108, .14);
          box-shadow: 0 0 0 3rem rgba(255, 255, 255, .28), 0 0 0 6rem rgba(217,0,108, .05);
        }
        .welcome-auth::after {
          width: 9rem;
          aspect-ratio: 1;
          left: -3rem;
          bottom: 8%;
          background: rgba(255, 241, 245, .7);
          box-shadow: 0 20px 60px rgba(164,0,80, .08);
        }
        .welcome-auth__nav {
          position: relative;
          z-index: 2;
          padding: .85rem clamp(1rem, 4vw, 2.5rem);
          border-bottom: 1px solid rgba(217,0,108, .12);
          background: rgba(255, 253, 253, .84);
          backdrop-filter: blur(20px) saturate(1.1);
          -webkit-backdrop-filter: blur(20px) saturate(1.1);
        }
        .welcome-auth__nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .welcome-auth__brand { display: inline-flex; align-items: center; gap: .65rem; }
        .welcome-auth__brand-mark {
          width: 2.15rem;
          height: 2.15rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(217,0,108, .34);
          border-radius: 50%;
          color: var(--auth-pink-deep);
          background: linear-gradient(145deg, #ffffff, #ffe8f3);
          box-shadow: 0 7px 20px rgba(164,0,80, .12);
          font-family: var(--font-display), sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
        }
        .welcome-auth__brand-name {
          color: var(--auth-ink);
          font-family: var(--font-display), sans-serif;
          font-size: 1.28rem;
          font-weight: 750;
          letter-spacing: -.025em;
        }
        .welcome-auth__nav :global(.lang-toggle) {
          border-color: rgba(217,0,108, .14);
          background: rgba(255, 255, 255, .68);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
        }
        .welcome-auth__nav :global(.lang-toggle button) { color: var(--auth-muted); }
        .welcome-auth__nav :global(.lang-toggle button.active) {
          color: #fff;
          background: linear-gradient(135deg, var(--auth-pink), var(--auth-pink-deep));
          box-shadow: 0 5px 16px rgba(164,0,80, .2);
        }
        .welcome-auth__main {
          min-height: calc(100vh - 65px);
          min-height: calc(100dvh - 65px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1.5rem, 5vw, 4.5rem) 1rem;
        }
        .welcome-auth__card {
          width: 100%;
          max-width: 420px;
          padding: clamp(1.7rem, 5vw, 2.6rem) clamp(1.25rem, 5vw, 2.25rem) 2rem;
          border: 1px solid var(--auth-line);
          border-radius: 1.25rem;
          background: rgba(255, 255, 255, .96);
          box-shadow: 0 1px 2px rgba(47,27,36,.035), 0 16px 48px rgba(164,0,80,.1);
        }
        .welcome-auth__intro { margin-bottom: 1.8rem; text-align: center; }
        .welcome-auth__bloom {
          width: 4.15rem;
          height: 4.15rem;
          margin: 0 auto .85rem;
          display: grid;
          place-items: center;
          border: 1px solid rgba(217,0,108, .15);
          border-radius: 1rem;
          background: linear-gradient(145deg, #fff, var(--auth-pink-soft));
          box-shadow: 0 8px 20px rgba(164,0,80, .08);
          font-size: 2rem;
          transform: rotate(-3deg);
        }
        .welcome-auth__bloom :global(svg) { width: 2.85rem; height: 2.85rem; overflow: visible; }
        .welcome-auth__title {
          margin: 0;
          color: var(--auth-ink);
          font-size: clamp(1.55rem, 5vw, 1.85rem);
          font-weight: 800;
          letter-spacing: -.04em;
        }
        .welcome-auth__subtitle { margin: .45rem auto 0; color: var(--auth-muted); font-size: .95rem; line-height: 1.55; }
        .welcome-auth__form { display: flex; flex-direction: column; gap: 1rem; }
        .welcome-auth__field { display: grid; gap: .45rem; }
        .welcome-auth__label { color: var(--auth-ink); font-size: .86rem; font-weight: 700; }
        .welcome-auth__field-link { justify-self: end; color: var(--auth-pink-deep); font-size: .78rem; font-weight: 700; text-decoration: none; }
        .welcome-auth__field-link:hover { text-decoration: underline; text-underline-offset: 3px; }
        .welcome-auth__input {
          width: 100%;
          min-height: 3.15rem;
          padding: .75rem 1rem;
          border: 1.5px solid var(--auth-line);
          border-radius: .9rem;
          outline: none;
          color: var(--auth-ink);
          background: #ffffff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.96);
          font: inherit;
          font-size: .95rem;
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
        }
        .welcome-auth__input::placeholder { color: rgba(117, 96, 106, .64); }
        .welcome-auth__input:hover { border-color: rgba(217,0,108, .3); }
        .welcome-auth__input:focus {
          border-color: var(--auth-pink);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(217,0,108, .13);
        }
        .welcome-auth__input:-webkit-autofill,
        .welcome-auth__input:-webkit-autofill:hover,
        .welcome-auth__input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--auth-ink);
          -webkit-box-shadow: 0 0 0 1000px var(--auth-cream) inset;
          caret-color: var(--auth-ink);
        }
        .welcome-auth__error {
          padding: .75rem 1rem;
          border: 1px solid rgba(164,0,80, .14);
          border-radius: .85rem;
          color: var(--auth-danger);
          background: rgba(255, 241, 245, .88);
          font-size: .87rem;
          text-align: center;
        }
        .welcome-auth__button {
          width: 100%;
          min-height: 3.2rem;
          padding: .78rem 1rem;
          border-radius: .95rem;
          font: inherit;
          font-size: .96rem;
          font-weight: 750;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .welcome-auth__button:hover:not(:disabled) { transform: translateY(-2px); }
        .welcome-auth__button:focus-visible { outline: 3px solid rgba(217,0,108, .25); outline-offset: 3px; }
        .welcome-auth__button:disabled { cursor: wait; opacity: .62; }
        .welcome-auth__button--primary {
          border: 1px solid transparent;
          color: #fff;
          background: linear-gradient(135deg, var(--auth-pink), var(--auth-pink-deep));
          box-shadow: 0 12px 28px rgba(164,0,80, .25);
        }
        .welcome-auth__button--primary:hover:not(:disabled) { box-shadow: 0 16px 34px rgba(164,0,80, .32); }
        .welcome-auth__button--secondary {
          border: 1px solid rgba(217,0,108, .2);
          color: var(--auth-ink);
          background: #ffffff;
          box-shadow: 0 8px 22px rgba(47, 27, 36, .08);
        }
        .welcome-auth__button--secondary:hover:not(:disabled) {
          border-color: rgba(217,0,108, .34);
          box-shadow: 0 12px 28px rgba(47, 27, 36, .12);
        }
        .welcome-auth__separator { display: flex; align-items: center; gap: .75rem; color: var(--auth-muted); font-size: .8rem; }
        .welcome-auth__separator::before,
        .welcome-auth__separator::after { content: ''; height: 1px; flex: 1; background: rgba(217,0,108, .14); }
        .welcome-auth__footer { margin: 1.5rem 0 0; color: var(--auth-muted); font-size: .88rem; line-height: 1.5; text-align: center; }
        .welcome-auth__guest-note { margin: .6rem 0 0; color: var(--auth-muted); font-size: .78rem; line-height: 1.45; text-align: center; }
        .welcome-auth__legal { display: flex; justify-content: center; gap: .55rem; margin: .75rem 0 0; color: var(--auth-muted); font-size: .72rem; }
        .welcome-auth__legal a { color: inherit; text-decoration: none; }
        .welcome-auth__legal a:hover { color: var(--auth-pink-deep); text-decoration: underline; text-underline-offset: 3px; }
        .welcome-auth__link { color: var(--auth-pink-deep); font-weight: 750; text-decoration: none; }
        .welcome-auth__link:hover { text-decoration: underline; text-underline-offset: 3px; }
        @media (max-width: 480px) {
          .welcome-auth__nav { padding: .7rem 1rem; }
          .welcome-auth__main { align-items: flex-start; padding-top: clamp(1.3rem, 7vh, 3.25rem); }
          .welcome-auth__card { border-radius: 1.1rem; box-shadow: 0 1px 3px rgba(47,27,36,.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .welcome-auth__button, .welcome-auth__input { transition: none; }
        }
      `}</style>
    </div>
  );
}
