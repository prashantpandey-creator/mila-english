'use client';

// Mila's neutral surface primitive. Color belongs to status and actions; the
// card itself keeps the same geometry in the warm and focus rooms.
import { CSSProperties, ReactNode } from 'react';

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
    style: { padding, cursor: onClick ? 'pointer' : 'default', ...style },
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
    <div className="mila-icon-tile" style={{ '--tile-size': `${size}px` } as CSSProperties}>
      {children}
    </div>
  );
}
