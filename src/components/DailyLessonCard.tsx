// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card, IconTile } from '@/components/ui/Card';

export default function DailyLessonCard({ title, subtitle, onStart }: {
  title: string; subtitle: string; onStart: () => void;
}) {
  return (
    <Card onClick={onStart} padding="18px 20px" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <IconTile size={52}>📖</IconTile>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: C.dark }}>{title}</div>
          <div style={{ fontSize: '0.85rem', color: C.warm, marginTop: 3 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: '1.3rem', color: C.gold }}>→</div>
      </div>
    </Card>
  );
}
