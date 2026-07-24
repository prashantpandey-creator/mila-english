'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { routeSurfaceForPath } from '@/lib/routeSurface';

export default function RouteSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const surface = routeSurfaceForPath(pathname);
  const isMarketing = pathname === '/' || pathname === '/start';

  // Route intent is deterministic: the same mineral-paper language on every
  // page. A saved device preference must never split Mila into competing
  // palettes or make a voice room feel like a different product.
  useEffect(() => {
    document.documentElement.dataset.milaTheme = 'light';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = '#faf8f5';
  }, [pathname, surface]);

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
