'use client';

// THE card primitive — one glass surface, used everywhere. Uniform radius,
// border, shadow, blur, and hover. If a surface on a page isn't a <Card>, it's
// a bug. This is what makes the app read as one system instead of a pile of
// mismatched boxes. The structural surface stays neutral; Mercury emerald is
// interaction while cyan is reserved for voice and listening.
import { CSSProperties, ReactNode } from 'react';
import { C } from '@/lib/theme';

const BASE: CSSProperties = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 18,
  boxShadow: 'var(--surface-card-shadow, 0 10px 34px rgba(0,0,0,0.48), inset 0 1px 0 rgba(154,242,211,0.035))',
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
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
      style={{ ...BASE, padding, cursor: onClick ? 'pointer' : 'default', ...style }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'var(--surface-card-line-hover, rgba(36,211,154,0.38))';
        e.currentTarget.style.boxShadow = 'var(--surface-card-shadow-hover, 0 16px 42px rgba(0,0,0,0.54), 0 0 28px rgba(36,211,154,0.07))';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = C.line;
        e.currentTarget.style.boxShadow = BASE.boxShadow as string;
      } : undefined}
    >
      {children}
    </div>
  );
}

// Compact utility tile for secondary content. Primary journeys use the same
// surface language with purpose-drawn line glyphs in LearningJourneyCard.
export function IconTile({ children, size = 44 }: { children: ReactNode; size?: number }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: size >= 52 ? 15 : 12,
      background: 'var(--surface-icon-tile, linear-gradient(145deg, rgba(36,211,154,0.07), rgba(106,220,245,0.025)))',
      border: `1px solid ${C.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size >= 52 ? '1.7rem' : '1.35rem',
    }}>
      {children}
    </div>
  );
}
