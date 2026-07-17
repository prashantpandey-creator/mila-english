'use client';

// Mila's neutral surface primitive. Color belongs to status and actions; the
// card itself keeps the same geometry in the warm and focus rooms.
import { CSSProperties, ReactNode } from 'react';
import { C } from '@/lib/theme';

const BASE: CSSProperties = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 16,
  boxShadow: 'var(--surface-card-shadow, 0 10px 34px rgba(0,0,0,0.48), inset 0 1px 0 rgba(154,242,211,0.035))',
  transition: 'transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
};

export function Card({
  children, onClick, hover = !!onClick, padding = '18px 20px', style, className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  hover?: boolean;
  padding?: string | number;
  style?: CSSProperties;
  className?: string;
}) {
  const shared = {
    className: `mila-card${hover ? ' mila-card--hover' : ''}${className ? ` ${className}` : ''}`,
    style: { ...BASE, padding, cursor: onClick ? 'pointer' : 'default', ...style },
  };

  if (onClick) {
    return (
      <button
        {...shared}
        type="button"
        className={`${shared.className} mila-card--interactive`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      {...shared}
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
