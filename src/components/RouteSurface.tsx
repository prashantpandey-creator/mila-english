'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { routeSurfaceForPath } from '@/lib/routeSurface';
import { resolveTheme, THEME_EVENT } from '@/lib/themePreference';

export default function RouteSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const surface = routeSurfaceForPath(pathname);

  // Resolved theme lives on <html> as data-mila-theme (seeded pre-paint by the
  // inline script in layout.tsx). CSS gates the welcome room's light styling on
  // it; React markup never depends on it, so there is nothing to mis-hydrate.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const theme = resolveTheme(media.matches);
      document.documentElement.dataset.milaTheme = theme;
      const color = surface === 'welcome' && theme === 'light' ? '#fff9fb' : '#0c0a0e';
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
  }, [surface]);

  useEffect(() => {
    document.documentElement.dataset.milaSurface = surface;
    return () => { delete document.documentElement.dataset.milaSurface; };
  }, [surface]);

  return (
    <div className={`mila-surface mila-surface--${surface}${pathname === '/' ? ' mila-surface--front' : ''}`} data-surface={surface}>
      {children}
    </div>
  );
}
