// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card, IconTile } from '@/components/ui/Card';
import MilaIcon from '@/components/ui/MilaIcon';

export default function DailyLessonCard({ title, subtitle, onStart }: {
  title: string; subtitle: string; onStart: () => void;
}) {
  return (
    <Card onClick={onStart} padding="18px 20px" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <IconTile size={52}><MilaIcon name="lesson" size={25}/></IconTile>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: C.dark }}>{title}</div>
          <div style={{ fontSize: '0.85rem', color: C.warm, marginTop: 3 }}>{subtitle}</div>
        </div>
        <div style={{ color: 'var(--jupiter-readable,var(--jupiter))' }}><MilaIcon name="arrow" size={19}/></div>
      </div>
    </Card>
  );
}
