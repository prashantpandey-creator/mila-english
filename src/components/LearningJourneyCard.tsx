'use client'

import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon'

export type JourneyKind = Extract<MilaIconName, 'level' | 'listening' | 'vocabulary' | 'tutor' | 'grammar'>

export default function LearningJourneyCard({
  kind,
  title,
  subtitle,
  onClick,
}: {
  kind: JourneyKind
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="journey-card"
      onClick={onClick}
      aria-label={`${title}. ${subtitle}`}
    >
      <span className="journey-card__icon" aria-hidden="true">
        <MilaIcon name={kind} size={25} />
      </span>

      <span className="journey-card__copy">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>

      <span className="journey-card__action" aria-hidden="true">
        <svg viewBox="0 0 20 20">
          <path d="M4 10h11M11 6l4 4-4 4" />
        </svg>
      </span>
    </button>
  )
}
