'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MilaIcon from '@/components/ui/MilaIcon';
import {
  INDIA_LEARNING_MARKET,
  INDIA_NATIVE_LANGUAGES,
  MILA_LEARNING_PROFILE_STORAGE_KEY,
  MILA_TARGET_LANGUAGE,
  resolveIndianNativeLanguage,
  teacherForNativeLanguage,
} from '@/lib/learningMarkets';
import './landing.css';

type SessionStatus = 'loading' | 'in' | 'out';

type StoredLearningProfile = {
  countryCode: 'IN';
  nativeLanguageId: string;
  targetLanguageId: 'en';
};

function readStoredLanguage(): string {
  try {
    const raw = window.localStorage.getItem(MILA_LEARNING_PROFILE_STORAGE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as Partial<StoredLearningProfile>;
    return resolveIndianNativeLanguage(parsed.nativeLanguageId)?.id ?? '';
  } catch {
    return '';
  }
}

export default function HomePage() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading');
  const [selectedLanguageId, setSelectedLanguageId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const isLoggedIn = sessionStatus === 'in';

  const selectedLanguage = useMemo(
    () => resolveIndianNativeLanguage(selectedLanguageId),
    [selectedLanguageId],
  );
  const teacher = useMemo(
    () => teacherForNativeLanguage(selectedLanguageId),
    [selectedLanguageId],
  );

  useEffect(() => {
    let cancelled = false;
    const queryLanguage = new URLSearchParams(window.location.search).get('nativeLanguage');
    const initialLanguage = resolveIndianNativeLanguage(queryLanguage)?.id || readStoredLanguage();
    if (initialLanguage) setSelectedLanguageId(initialLanguage);

    fetch('/api/users/me', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          setSessionStatus('out');
          return;
        }
        const profile = await response.json().catch(() => null);
        const savedLanguage = resolveIndianNativeLanguage(profile?.nativeLanguage);
        if (savedLanguage) setSelectedLanguageId(savedLanguage.id);
        setSessionStatus('in');
      })
      .catch(() => {
        if (!cancelled) setSessionStatus('out');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const rememberSelection = () => {
    if (!selectedLanguage) return;
    const profile: StoredLearningProfile = {
      countryCode: 'IN',
      nativeLanguageId: selectedLanguage.id,
      targetLanguageId: 'en',
    };
    window.localStorage.setItem(MILA_LEARNING_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  };

  const startLearning = async () => {
    if (!selectedLanguage || saving) return;
    setSaving(true);
    setSaveError('');
    rememberSelection();

    if (!isLoggedIn) {
      const params = new URLSearchParams({
        nativeLanguage: selectedLanguage.name,
        returnTo: '/dashboard',
      });
      window.location.assign(`/register?${params.toString()}`);
      return;
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nativeLanguage: selectedLanguage.name }),
      });
      if (!response.ok) throw new Error('save failed');
      window.location.assign('/dashboard');
    } catch {
      setSaveError('We could not save your language. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="lp-minimal">
      <header className="lp-minimal__nav">
        <Link className="lp-minimal__brand" href="/" aria-label="Mila English home">
          <span aria-hidden="true">M</span>
          <strong>Mila <b>English</b></strong>
        </Link>

        <div className="lp-minimal__nav-actions">
          <span className="lp-minimal__market">India · English</span>
          <Link
            className="lp-minimal__account"
            href={isLoggedIn ? '/account' : '/login?returnTo=%2Fdashboard'}
          >
            {isLoggedIn ? 'My account' : 'Sign in'}
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-minimal__hero">
          <div className="lp-minimal__copy">
            <p className="lp-minimal__eyebrow">
              <span aria-hidden="true" />
              English learning for India
            </p>

            <h1>
              English, explained
              <em>in your language.</em>
            </h1>

            <p className="lp-minimal__intro">
              Start with the language you already know. Your Mila English teacher
              explains clearly, introduces English step by step, and adapts the path
              to your level.
            </p>

            <div className="lp-minimal__actions">
              <button
                className="lp-minimal__primary"
                type="button"
                onClick={startLearning}
                disabled={!selectedLanguage || saving}
              >
                {saving ? 'Saving…' : selectedLanguage ? 'Start learning English' : 'Choose your native language'}
                <MilaIcon name="arrow" size={20} />
              </button>
              <Link className="lp-minimal__secondary" href="/login?returnTo=%2Fdashboard">
                I already have an account
              </Link>
            </div>

            <p className="lp-minimal__trust">
              <MilaIcon name="lock" size={16} />
              English is the only learning target
              <span aria-hidden="true">·</span>
              Start free
              <span aria-hidden="true">·</span>
              Progress saved
            </p>
          </div>

          <aside className="lp-onboarding-card" aria-labelledby="lp-onboarding-title">
            <div className="lp-onboarding-card__topline">
              <span>Set up your learning path</span>
              <i>01</i>
            </div>

            <div className="lp-onboarding-card__field">
              <span>Country</span>
              <strong>
                <b aria-hidden="true">IN</b>
                {INDIA_LEARNING_MARKET.countryName}
              </strong>
            </div>

            <label className="lp-onboarding-card__field" htmlFor="native-language">
              <span>Your native language</span>
              <select
                id="native-language"
                value={selectedLanguageId}
                onChange={(event) => {
                  setSelectedLanguageId(event.target.value);
                  setSaveError('');
                }}
              >
                <option value="">Choose the language you know best</option>
                {INDIA_NATIVE_LANGUAGES.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.nativeName} · {language.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="lp-onboarding-card__target">
              <span>You will learn</span>
              <strong>{MILA_TARGET_LANGUAGE.name}</strong>
              <small>One clear target. No language switching.</small>
            </div>

            {selectedLanguage && teacher ? (
              <div className="lp-teacher" aria-live="polite">
                <div className="lp-teacher__mark" aria-hidden="true">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <span>Your matched teacher</span>
                  <h2 id="lp-onboarding-title">{teacher.name}</h2>
                  <p>
                    {teacher.role} · explains in {selectedLanguage.name}
                  </p>
                  <blockquote lang={selectedLanguage.locale}>
                    {selectedLanguage.promise}
                  </blockquote>
                </div>
              </div>
            ) : (
              <div className="lp-teacher lp-teacher--empty">
                <div className="lp-teacher__mark" aria-hidden="true">AI</div>
                <div>
                  <span>Your matched teacher</span>
                  <h2 id="lp-onboarding-title">Choose your language</h2>
                  <p>We will match an AI English teacher who can explain in it.</p>
                </div>
              </div>
            )}

            {saveError ? <p className="lp-onboarding-card__error" role="alert">{saveError}</p> : null}
          </aside>
        </section>

        <section className="lp-method" aria-labelledby="lp-method-title">
          <p className="lp-method__eyebrow">How Mila English starts</p>
          <h2 id="lp-method-title">Your language is the bridge. English is the destination.</h2>
          <div className="lp-method__steps">
            <article>
              <span>01</span>
              <p><strong>Choose your language</strong>Tell us the language you understand naturally.</p>
            </article>
            <article>
              <span>02</span>
              <p><strong>Meet your AI teacher</strong>Get explanations and encouragement in that language.</p>
            </article>
            <article>
              <span>03</span>
              <p><strong>Build real English</strong>Practise short lessons, speech, and everyday situations.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="lp-minimal__footer">
        <span>© {new Date().getFullYear()} Mila English</span>
        <nav aria-label="Footer">
          <Link href="/support">Support</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </div>
  );
}
