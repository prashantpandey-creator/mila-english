// @ts-nocheck
'use client';

import { Card } from '@/components/ui/Card';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';

// Progress is communicated by value, icon, and copy while the visual signal
// stays consistent with the rest of Mila.
export default function ProgressSummary({ items }: {
  items: { icon: MilaIconName; val: number | string; label: string; color?: string }[];
}) {
  return (
    <div className="metric-grid">
      {items.map((s, i) => (
        <Card key={i} hover={false} padding="0" className="metric-card">
          <div className="metric-card__icon"><MilaIcon name={s.icon} size={20} /></div>
          <div className="metric-card__value">{s.val}</div>
          <div className="metric-card__label">{s.label}</div>
        </Card>
      ))}
    </div>
  );
}
