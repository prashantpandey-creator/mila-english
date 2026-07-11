// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card, IconTile } from '@/components/ui/Card';

export default function LeaderboardCard({ lang }: { lang: 'ru'|'en' }) {
  return (
    <Card hover={false} padding="16px 20px" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <IconTile>🏅</IconTile>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.dark }}>
          {lang==='ru'?'Ты в топ-20% на этой неделе':"You're in the top 20% this week"}
        </div>
        <div style={{ fontSize: '0.8rem', color: C.warm, marginTop: 2 }}>
          {lang==='ru'?'Среди русскоговорящих учеников':'Among Russian-speaking learners'}
        </div>
      </div>
    </Card>
  );
}
