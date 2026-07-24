'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { routeSurfaceForPath } from '@/lib/routeSurface';
import { useProduct } from '@/lib/product-context';
import { effectiveProductPath } from '@/lib/productHosts';

export default function RouteSurface({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const product = useProduct();
  const effectivePathname = effectiveProductPath(product, pathname);
  const surface = routeSurfaceForPath(effectivePathname);
  const isMarketing = product === 'mia'
    || effectivePathname === '/'
    || effectivePathname === '/start'
    || effectivePathname === '/mia';
  const isFront = effectivePathname === '/' || effectivePathname === '/mia';

  // Route intent is deterministic: the same mineral-paper language on every
  // page. A saved device preference must never split Mila into competing
  // palettes or make a voice room feel like a different product.
  useEffect(() => {
    document.documentElement.dataset.milaTheme = product === 'gia' ? 'dark' : 'light';
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = product === 'gia' ? '#04070a' : product === 'mia' ? '#f5efe4' : '#faf8f5';
  }, [pathname, product, surface]);

  useEffect(() => {
    document.documentElement.dataset.milaSurface = surface;
    document.documentElement.dataset.milaApp = isMarketing ? 'marketing' : 'app';
    document.documentElement.dataset.milaRoute = effectivePathname;
    document.documentElement.dataset.product = product;
    return () => {
      delete document.documentElement.dataset.milaSurface;
      delete document.documentElement.dataset.milaApp;
      delete document.documentElement.dataset.milaRoute;
    };
  }, [effectivePathname, isMarketing, product, surface]);

  return (
    <div
      className={`mila-surface product-surface product-surface--${product} mila-surface--${surface} ${isMarketing ? 'mila-surface--marketing' : 'mila-surface--app'}${isFront ? ' mila-surface--front' : ''}`}
      data-product={product}
      data-surface={surface}
      data-route={effectivePathname}
    >
      {children}
    </div>
  );
}
