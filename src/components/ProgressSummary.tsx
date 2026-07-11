// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card } from '@/components/ui/Card';

// The stat value wears gold — one accent, not a per-tile rainbow. The label
// stays warm-stone. Uniform across every stat row in the app.
export default function ProgressSummary({ items }: {
  items: { emoji: string; val: number | string; label: string; color?: string }[];
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 12 }}>
      {items.map((s, i) => (
        <Card key={i} hover={false} padding="16px 12px" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', opacity: 0.9 }}>{s.emoji}</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.9rem', fontWeight: 700, color: C.gold, lineHeight: 1.15 }}>{s.val}</div>
          <div style={{ fontSize: '0.72rem', color: C.warm, letterSpacing: '0.02em' }}>{s.label}</div>
        </Card>
      ))}
    </div>
  );
}
