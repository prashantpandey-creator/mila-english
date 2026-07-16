// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';

// The stat value wears gold — one accent, not a per-tile rainbow. The label
// stays warm-stone. Uniform across every stat row in the app.
export default function ProgressSummary({ items }: {
  items: { icon: MilaIconName; val: number | string; label: string; color?: string }[];
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 12 }}>
      {items.map((s, i) => (
        <Card key={i} hover={false} padding="16px 12px" style={{ textAlign: 'center' }}>
          <div style={{ width: 34, height: 28, display: 'grid', placeItems: 'center', margin: '0 auto 2px', color: s.color || C.gold }}><MilaIcon name={s.icon} size={21} /></div>
          <div style={{ fontFamily: "var(--font-display, 'Manrope'),sans-serif", fontSize: '1.65rem', fontWeight: 700, color: C.gold, lineHeight: 1.15 }}>{s.val}</div>
          <div style={{ fontSize: '0.72rem', color: C.warm, letterSpacing: '0.02em' }}>{s.label}</div>
        </Card>
      ))}
    </div>
  );
}
