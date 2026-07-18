'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { routeSurfaceForPath } from '@/lib/routeSurface';
import { resolveTheme, THEME_EVENT } from '@/lib/themePreference';

export default function RouteSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const surface = routeSurfaceForPath(pathname);
  const isMarketing = pathname === '/' || pathname === '/start';

  // Resolved theme lives on <html> as data-mila-theme (seeded pre-paint by the
  // inline script in layout.tsx). CSS gates the welcome room's light styling on
  // it; React markup never depends on it, so there is nothing to mis-hydrate.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const theme = resolveTheme(media.matches);
      document.documentElement.dataset.milaTheme = theme;
      const color = pathname === '/start'
        ? '#0a080c'
        : isMarketing
          ? '#f8f3eb'
          : surface === 'welcome' && theme === 'light'
            ? '#f3ede0'
            : '#0c0d11';
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (meta) meta.content = color;
    };
    apply();
    media.addEventListener('change', apply);
    window.addEventListener(THEME_EVENT, apply);
    window.addEventListener('storage', apply);
    return () => {
      media.removeEventListener('change', apply);
      window.removeEventListener(THEME_EVENT, apply);
      window.removeEventListener('storage', apply);
    };
  }, [isMarketing, pathname, surface]);

  useEffect(() => {
    document.documentElement.dataset.milaSurface = surface;
    document.documentElement.dataset.milaApp = isMarketing ? 'marketing' : 'app';
    document.documentElement.dataset.milaRoute = pathname;
    return () => {
      delete document.documentElement.dataset.milaSurface;
      delete document.documentElement.dataset.milaApp;
      delete document.documentElement.dataset.milaRoute;
    };
  }, [isMarketing, pathname, surface]);

  return (
    <div
      className={`mila-surface mila-surface--${surface} ${isMarketing ? 'mila-surface--marketing' : 'mila-surface--app'}${pathname === '/' ? ' mila-surface--front' : ''}`}
      data-surface={surface}
      data-route={pathname}
    >
      {children}
    </div>
  );
}
