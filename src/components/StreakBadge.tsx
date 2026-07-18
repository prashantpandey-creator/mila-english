// @ts-nocheck
'use client';

import MilaIcon from '@/components/ui/MilaIcon';

export default function StreakBadge({ days, lang }: { days: number; lang: 'ru'|'en' }) {
  return (
    <div className="streak-card-v2">
      <div className="streak-card-v2__icon"><MilaIcon name="streak" size={25}/></div>
      <div>
        <div className="streak-card-v2__title">{days} {lang==='ru'?'дней подряд':'day streak'}</div>
        <div className="streak-card-v2__copy">
          {lang==='ru'?'Не останавливайся!':"Don't break the chain!"}
        </div>
      </div>
    </div>
  );
}
