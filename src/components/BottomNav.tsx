'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';

// The rim on the wheel. Before this, every room was a dead-end back to the
// dashboard (hub-and-spoke, no rim). This bar keeps the five core rooms one
// tap apart from anywhere in the app. Mounted once in the layout; it hides
// itself on the marketing door, auth, and the immersive voice room.
type Tab = { href: string; icon: MilaIconName | 'home'; ru: string; en: string };

const TABS: Tab[] = [
  { href: '/dashboard', icon: 'home', ru: 'Главная', en: 'Home' },
  { href: '/listen', icon: 'listening', ru: 'Слушать', en: 'Listen' },
  { href: '/vocabulary', icon: 'vocabulary', ru: 'Слова', en: 'Words' },
  { href: '/chat', icon: 'tutor', ru: 'Наставник', en: 'Tutor' },
  { href: '/progress', icon: 'progress', ru: 'Прогресс', en: 'Progress' },
];

const HIDDEN = ['/', '/start', '/login', '/register', '/darshan', '/pia'];

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3.5 11 8.5-7 8.5 7" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname() || '/';
  const { lang } = useI18n();

  const hidden = HIDDEN.some((r) => pathname === r || (r !== '/' && pathname.startsWith(`${r}/`)));

  // Reserve space so page content never sits under the bar. Keyed on <body>
  // so both AppShell pages and the two bespoke pages clear it.
  useEffect(() => {
    const b = document.body;
    if (hidden) b.removeAttribute('data-bottom-nav');
    else b.setAttribute('data-bottom-nav', '1');
    return () => b.removeAttribute('data-bottom-nav');
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav className="mila-tabbar" aria-label={lang === 'ru' ? 'Основная навигация' : 'Primary navigation'}>
      <div className="mila-tabbar__inner">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mila-tabbar__tab${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="mila-tabbar__icon">
                {tab.icon === 'home' ? <HomeGlyph /> : <MilaIcon name={tab.icon} size={22} />}
              </span>
              <span className="mila-tabbar__label">{lang === 'ru' ? tab.ru : tab.en}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
