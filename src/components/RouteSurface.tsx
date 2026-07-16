'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { routeSurfaceForPath } from '@/lib/routeSurface';

export default function RouteSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const surface = routeSurfaceForPath(pathname);

  useEffect(() => {
    const color = surface === 'welcome' ? '#fff9fb' : '#0c0a0e';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = color;
    document.documentElement.dataset.milaSurface = surface;
    return () => { delete document.documentElement.dataset.milaSurface; };
  }, [surface]);

  return (
    <div className={`mila-surface mila-surface--${surface}${pathname === '/' ? ' mila-surface--front' : ''}`} data-surface={surface}>
      {children}
    </div>
  );
}
