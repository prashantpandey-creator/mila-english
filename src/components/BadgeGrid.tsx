// @ts-nocheck
'use client';

import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';

export default function BadgeGrid({ badges }: { badges: { icon: MilaIconName; t: string; d: string; u: boolean }[] }) {
  return (
    <div className="badge-grid">
      {badges.map((b,i)=>(
        <div className={`badge-tile ${b.u?'is-unlocked':'is-locked'}`} key={i}>
          <div className="badge-tile__icon"><MilaIcon name={b.u?b.icon:'lock'} size={23}/></div>
          <div className="badge-tile__title">{b.t}</div>
          <div className="badge-tile__copy">{b.d}</div>
        </div>
      ))}
    </div>
  );
}
