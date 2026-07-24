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
import { MILA_PUBLIC_BRAND } from '@/lib/milaBrand';
import './landing.css';

type SessionStatus = 'loading' | 'in' | 'out';
type EntryIntent = 'account' | 'guest';

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
  const [languageError, setLanguageError] = useState(false);
  const [returnTo, setReturnTo] = useState('/dashboard');
  const [entryIntent, setEntryIntent] = useState<EntryIntent>('account');
  const [languageChosenThisVisit, setLanguageChosenThisVisit] = useState(false);
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
    setEntryIntent(params.get('intent') === 'guest' ? 'guest' : 'account');
    setReturnTo(safeReturnTo(params.get('returnTo'), '/dashboard'));
    const queryLanguageId = resolveIndianNativeLanguage(queryLanguage)?.id;
    const initialLanguage = queryLanguageId || readStoredLanguage();
    setLanguageChosenThisVisit(Boolean(queryLanguageId));
    if (initialLanguage) {
      setSelectedLanguageId(initialLanguage);
      storeLearningLanguage(initialLanguage);
    }
    if (shouldChooseLanguage && !initialLanguage) {
      setSaveError('Choose the language you understand best.');
      setLanguageError(true);
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
      setLanguageError(true);
      languageSelectRef.current?.focus();
      return;
    }

    setSaving(true);
    setSaveError('');
    setLanguageError(false);
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
      if (entryIntent === 'guest') {
        try {
          const response = await fetch('/api/auth/guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nativeLanguage: selectedLanguage.name }),
          });
          const body = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(body?.error || 'We could not start a guest session.');
          }
          window.location.assign(returnTo);
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : 'We could not start a guest session.');
          setSaving(false);
        }
        return;
      }
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
        <Link className="lp-minimal__brand" href="/" aria-label={`${MILA_PUBLIC_BRAND.name} home`}>
          <span aria-hidden="true" />
          <strong>{MILA_PUBLIC_BRAND.name}</strong>
        </Link>

        <div className="lp-minimal__nav-actions">
          {sessionStatus === 'loading' ? (
            <span className="lp-minimal__account lp-minimal__account--loading">Checking…</span>
          ) : (
            <Link
              className="lp-minimal__account"
              href={isLoggedIn
                ? '/dashboard'
                : `/login?returnTo=${encodeURIComponent(returnTo)}${selectedLanguage && languageChosenThisVisit ? `&nativeLanguage=${encodeURIComponent(selectedLanguage.name)}` : ''}`}
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
              <em>in your language.</em>
            </h1>

            <p className="lp-minimal__intro">
              Choose a language you already know. Your AI teacher will use it
              to explain English from day one.
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
              Choose your language
            </p>

            <label className="lp-simple-field" htmlFor="native-language">
              <span>Which language should we explain English in?</span>
              <select
                ref={languageSelectRef}
                id="native-language"
                value={selectedLanguageId}
                aria-invalid={languageError ? true : undefined}
                aria-describedby={languageError ? 'native-language-error' : 'native-language-hint'}
                onChange={(event) => {
                  const nextLanguageId = event.target.value;
                  setSelectedLanguageId(nextLanguageId);
                  setLanguageChosenThisVisit(true);
                  storeLearningLanguage(nextLanguageId);
                  setSaveError('');
                  setLanguageError(false);
                }}
              >
                <option value="">Select a language</option>
                {INDIA_NATIVE_LANGUAGES.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.nativeName} · {language.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedLanguage && teacher ? (
              <div className="lp-simple-match" id="native-language-hint" aria-live="polite">
                <div className="lp-simple-match__mark" aria-hidden="true">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <strong>{teacher.name} teaches English in {selectedLanguage.name}</strong>
                  <p>
                    Your matched AI English teacher
                  </p>
                </div>
              </div>
            ) : (
              <p className="lp-simple-hint" id="native-language-hint">12 Indian languages supported.</p>
            )}

            {saveError ? <p className="lp-onboarding-card__error" id="native-language-error" role="alert">{saveError}</p> : null}

            <button
              className="lp-minimal__primary lp-minimal__primary--simple"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Opening your learning…'
                : isLoggedIn
                  ? 'Continue learning'
                  : entryIntent === 'guest'
                    ? 'Continue as guest'
                    : 'Start learning'}
              <MilaIcon name="arrow" size={20} />
            </button>

            <p className="lp-minimal__trust">
              12 Indian languages
              <span aria-hidden="true">·</span>
              Free to start
              <span aria-hidden="true">·</span>
              Progress saved
            </p>
          </form>
        </section>
      </main>

      <footer className="lp-minimal__footer">
        <span>© {new Date().getFullYear()} {MILA_PUBLIC_BRAND.name}</span>
        <nav aria-label="Footer">
          <Link href="/support">Support</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </div>
  );
}
