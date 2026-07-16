'use client';

// THE card primitive — one glass surface, used everywhere. Uniform radius,
// border, shadow, blur, and hover. If a surface on a page isn't a <Card>, it's
// a bug. This is what makes the app read as one system instead of a pile of
// mismatched boxes. The structural surface stays neutral; cyan is interaction.
import { CSSProperties, ReactNode } from 'react';

const BASE: CSSProperties = {
  background: 'rgba(8,8,9,0.86)',
  border: '1px solid rgba(255,255,255,0.12)',
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
        e.currentTarget.style.borderColor = 'rgba(106,220,245,0.36)';
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.5)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
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
      background: 'rgba(255,255,255,0.045)',
      border: '1px solid rgba(255,255,255,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size >= 52 ? '1.7rem' : '1.35rem',
    }}>
      {children}
    </div>
  );
}
