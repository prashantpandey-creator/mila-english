// @ts-nocheck
'use client';

import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';
import { Card } from '@/components/ui/Card';

export default function LessonList({ lessons, onSelect }: {
  lessons: { id: number | string; icon: MilaIconName; title: string; sub: string; time: string; diffNum: number }[];
  onSelect: (id: number | string) => void;
}) {
  return (
    <div className="lesson-stack">
      {lessons.map(l=>(
        <Card className="lesson-card" key={l.id} onClick={()=>onSelect(l.id)} padding="0">
          <div className="lesson-card__icon"><MilaIcon name={l.icon} size={23}/></div>
          <div className="lesson-card__copy">
            <div className="lesson-card__title">{l.title}</div>
            <div className="lesson-card__subtitle">{l.sub}</div>
            <div className="lesson-card__meta">
              <span><MilaIcon name="time" size={12}/>{l.time}</span>
              <span className="lesson-card__difficulty" aria-label={`Difficulty ${l.diffNum} of 3`}>
                {[1,2,3].map(level=><i className={level<=l.diffNum?'is-filled':''} key={level}/>)}
              </span>
            </div>
          </div>
          <MilaIcon name="arrow" size={19}/>
        </Card>
      ))}
    </div>
  );
}
