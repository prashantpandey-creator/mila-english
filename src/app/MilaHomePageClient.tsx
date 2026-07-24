'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import MilaIcon from '@/components/ui/MilaIcon';
import { safeReturnTo } from '@/lib/navigation';
import {
  INDIA_NATIVE_LANGUAGES,
  MILA_LEARNING_PROFILE_STORAGE_KEY,
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

function storeLearningLanguage(languageId: string) {
  const language = resolveIndianNativeLanguage(languageId);
  try {
    if (!language) {
      window.localStorage.removeItem(MILA_LEARNING_PROFILE_STORAGE_KEY);
      return;
    }
    const profile: StoredLearningProfile = {
      countryCode: 'IN',
      nativeLanguageId: language.id,
      targetLanguageId: 'en',
    };
    window.localStorage.setItem(MILA_LEARNING_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // The query-string handoff still preserves the choice when storage is unavailable.
  }
}

export default function HomePage() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading');
  const [selectedLanguageId, setSelectedLanguageId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [returnTo, setReturnTo] = useState('/dashboard');
  const languageSelectRef = useRef<HTMLSelectElement>(null);
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
    const params = new URLSearchParams(window.location.search);
    const queryLanguage = params.get('nativeLanguage');
    const shouldChooseLanguage = params.get('chooseLanguage') === '1';
    setReturnTo(safeReturnTo(params.get('returnTo'), '/dashboard'));
    const initialLanguage = resolveIndianNativeLanguage(queryLanguage)?.id || readStoredLanguage();
    if (initialLanguage) {
      setSelectedLanguageId(initialLanguage);
      storeLearningLanguage(initialLanguage);
    }
    if (shouldChooseLanguage) {
      setSaveError('Choose the language you understand best.');
      window.requestAnimationFrame(() => {
        languageSelectRef.current?.focus();
        languageSelectRef.current?.scrollIntoView({ block: 'center' });
      });
    }

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

  const startLearning = async () => {
    if (saving) return;
    if (!selectedLanguage) {
      setSaveError('Choose the language you understand best.');
      languageSelectRef.current?.focus();
      return;
    }

    setSaving(true);
    setSaveError('');
    storeLearningLanguage(selectedLanguage.id);

    let hasSession = isLoggedIn;
    if (sessionStatus === 'loading') {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        hasSession = response.ok;
        setSessionStatus(response.ok ? 'in' : 'out');
      } catch {
        hasSession = false;
        setSessionStatus('out');
      }
    }

    if (!hasSession) {
      const params = new URLSearchParams({
        nativeLanguage: selectedLanguage.name,
        returnTo,
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
      window.location.assign(returnTo);
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
          {sessionStatus === 'loading' ? (
            <span className="lp-minimal__account lp-minimal__account--loading">Checking…</span>
          ) : (
            <Link
              className="lp-minimal__account"
              href={isLoggedIn
                ? '/dashboard'
                : `/login?returnTo=${encodeURIComponent(returnTo)}${selectedLanguage ? `&nativeLanguage=${encodeURIComponent(selectedLanguage.name)}` : ''}`}
            >
              {isLoggedIn ? 'My learning' : 'Sign in'}
            </Link>
          )}
        </div>
      </header>

      <main>
        <section className="lp-minimal__hero lp-minimal__hero--simple">
          <div className="lp-minimal__copy">
            <p className="lp-minimal__eyebrow">
              <span aria-hidden="true" />
              English learning for India
            </p>

            <h1>
              Learn English
              <em>from your language.</em>
            </h1>

            <p className="lp-minimal__intro">
              Choose the language you understand best. Your AI English teacher
              will use it to explain English clearly.
            </p>
          </div>

          <form
            className="lp-onboarding-card lp-onboarding-card--simple"
            aria-labelledby="lp-onboarding-title"
            onSubmit={(event) => {
              event.preventDefault();
              void startLearning();
            }}
          >
            <p className="lp-onboarding-card__topline" id="lp-onboarding-title">
              Start here
            </p>

            <label className="lp-simple-field" htmlFor="native-language">
              <span>Which language do you understand best?</span>
              <select
                ref={languageSelectRef}
                id="native-language"
                value={selectedLanguageId}
                onChange={(event) => {
                  const nextLanguageId = event.target.value;
                  setSelectedLanguageId(nextLanguageId);
                  storeLearningLanguage(nextLanguageId);
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

            {selectedLanguage && teacher ? (
              <div className="lp-simple-match" aria-live="polite">
                <div className="lp-simple-match__mark" aria-hidden="true">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <strong>{teacher.name} will teach you English</strong>
                  <p>
                    AI English teacher · explanations in {selectedLanguage.name}
                  </p>
                </div>
              </div>
            ) : (
              <p className="lp-simple-hint">12 Indian languages supported.</p>
            )}

            {saveError ? <p className="lp-onboarding-card__error" role="alert">{saveError}</p> : null}

            <button
              className="lp-minimal__primary lp-minimal__primary--simple"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Opening your learning…' : 'Continue'}
              <MilaIcon name="arrow" size={20} />
            </button>

            <p className="lp-minimal__trust">
              English only
              <span aria-hidden="true">·</span>
              Free to start
              <span aria-hidden="true">·</span>
              Progress saved
            </p>
          </form>
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
