'use client';

// THE card primitive — one glass surface, used everywhere. Uniform radius,
// border, shadow, blur, and hover. If a surface on a page isn't a <Card>, it's
// a bug. This is what makes the app read as one system instead of a pile of
// mismatched boxes. Accent on hover is gold; nothing else.
import { CSSProperties, ReactNode } from 'react';

const BASE: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 18,
  boxShadow: '0 6px 24px rgba(0,0,0,0.38)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  transition: 'transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
};

export function Card({
  children, onClick, hover = !!onClick, padding = '18px 20px', style,
}: {
  children: ReactNode;
  onClick?: () => void;
  hover?: boolean;
  padding?: string | number;
  style?: CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={{ ...BASE, padding, cursor: onClick ? 'pointer' : 'default', ...style }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)';
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.5)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
        e.currentTarget.style.boxShadow = BASE.boxShadow as string;
      } : undefined}
    >
      {children}
    </div>
  );
}

// The icon tile — ALWAYS the same. One gold-tinted square, never a rainbow of
// per-card colors. Consistency here is what killed the "weird default" feeling.
export function IconTile({ children, size = 44 }: { children: ReactNode; size?: number }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: size >= 52 ? 15 : 12,
      background: 'rgba(212,175,55,0.10)',
      border: '1px solid rgba(212,175,55,0.22)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size >= 52 ? '1.7rem' : '1.35rem',
    }}>
      {children}
    </div>
  );
}
