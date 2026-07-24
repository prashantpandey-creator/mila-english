'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useProduct } from '@/lib/product-context';
import { MILA_PUBLIC_BRAND } from '@/lib/milaBrand';

type AppShellProps = {
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
};

type AppHeaderProps = {
  title?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  brand?: 'Mila' | 'Gia' | 'Mia';
  className?: string;
};

type AppMainProps = {
  children: ReactNode;
  className?: string;
  width?: 'compact' | 'work' | 'wide';
  centered?: boolean;
};

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export function AppShell({ children, className, fullHeight = false }: AppShellProps) {
  return <div className={cx('app-shell', fullHeight && 'app-shell--full', className)}>{children}</div>;
}

export function AppHeader({ title, eyebrow, actions, backHref = '/dashboard', brand, className }: AppHeaderProps) {
  const product = useProduct();
  const brandId = brand ?? (product === 'gia' ? 'Gia' : product === 'mia' ? 'Mia' : 'Mila');
  const resolvedBrand = brandId === 'Mila' ? MILA_PUBLIC_BRAND.name : brandId;
  const backLabel = backHref === '/'
    ? `${resolvedBrand} · home`
    : backHref === '/lessons'
      ? `${resolvedBrand} · lessons`
      : `${resolvedBrand} · dashboard`;
  return (
    <header className={cx('app-header', className)}>
      <div className="app-header__inner">
        <div className="app-header__identity">
          <Link className="app-header__brand" href={backHref} aria-label={backLabel}>
            <span className="app-header__mark" aria-hidden="true">{brandId === 'Gia' ? 'G' : brandId === 'Mia' ? 'M' : 'F'}</span>
            <span>{resolvedBrand}</span>
          </Link>
          {title ? (
            <div className="app-header__heading">
              {eyebrow ? <span className="app-header__eyebrow">{eyebrow}</span> : null}
              <h1>{title}</h1>
            </div>
          ) : null}
        </div>
        {actions ? <div className="app-header__actions">{actions}</div> : null}
      </div>
    </header>
  );
}

export function AppMain({ children, className, width = 'work', centered = false }: AppMainProps) {
  return (
    <main className={cx('app-main', `app-main--${width}`, centered && 'app-main--centered', className)}>
      {children}
    </main>
  );
}
