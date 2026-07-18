'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { routeSurfaceForPath } from '@/lib/routeSurface';

export default function RouteSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const surface = routeSurfaceForPath(pathname);
  const isMarketing = pathname === '/' || pathname === '/start';

  // Route intent is deterministic: warm paper throughout the site; neutral
  // near-black is reserved for immersive voice and contained editorial bands.
  // A saved device preference must never split Mila into competing palettes.
  useEffect(() => {
    const dark = surface === 'focus';
    document.documentElement.dataset.milaTheme = dark ? 'dark' : 'light';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#0c0d11' : '#f8f4ee';
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
