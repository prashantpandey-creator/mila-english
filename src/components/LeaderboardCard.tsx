// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import { Card, IconTile } from '@/components/ui/Card';
import MilaIcon from '@/components/ui/MilaIcon';

export default function LeaderboardCard({ lang, stats }: { lang: 'ru'|'en'; stats?: { completedLessons: number; avgScore: number } | null }) {
  return (
    <Card hover={false} padding="16px 20px" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <IconTile><span style={{color:C.gold,display:'grid'}}><MilaIcon name="practice" size={21}/></span></IconTile>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.dark }}>
          {lang==='ru'?'Твоя практика':'Your practice'}
        </div>
        <div style={{ fontSize: '0.8rem', color: C.warm, marginTop: 2 }}>
          {stats
            ? (lang==='ru'?`${stats.completedLessons} уроков · средний результат ${stats.avgScore}%`:`${stats.completedLessons} lessons · ${stats.avgScore}% average`)
            : (lang==='ru'?'Здесь появятся твои реальные результаты':'Your real results will appear here')}
        </div>
      </div>
    </Card>
  );
}
