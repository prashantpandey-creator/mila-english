import type { ReactNode } from 'react'

import styles from './EditorialChoice.module.css'

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

type EditorialChoiceGroupProps = {
  children: ReactNode
  label: string
  note?: string
  index?: string
  columns?: 2 | 3 | 5
  className?: string
}

type EditorialChoiceProps = {
  title: string
  detail: string
  onClick: () => void
  mark?: string
  icon?: ReactNode
  meta?: string
  selected?: boolean
  featured?: boolean
  className?: string
  ariaLabel?: string
}

export function EditorialChoiceGroup({
  children,
  label,
  note,
  index,
  columns = 3,
  className,
}: EditorialChoiceGroupProps) {
  return (
    <section className={cx(styles.group, className)} aria-label={label}>
      <div className={styles.heading}>
        {index ? <span className={styles.index} aria-hidden="true">{index}</span> : null}
        <div>
          <h2 className={styles.label}>{label}</h2>
          {note ? <p className={styles.note}>{note}</p> : null}
        </div>
      </div>
      <div className={cx(styles.grid, styles[`columns${columns}`])} role="group" aria-label={label}>
        {children}
      </div>
    </section>
  )
}

export function EditorialChoice({
  title,
  detail,
  onClick,
  mark,
  icon,
  meta,
  selected,
  featured,
  className,
  ariaLabel,
}: EditorialChoiceProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(styles.choice, selected && styles.selected, featured && styles.featured, className)}
      aria-label={ariaLabel}
      aria-pressed={selected === undefined ? undefined : selected}
    >
      <span className={styles.topline}>
        <span className={styles.identity} aria-hidden="true">
          {icon ? <span className={styles.icon}>{icon}</span> : null}
          {mark ? <span className={styles.mark}>{mark}</span> : null}
        </span>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
        {selected ? <span className={styles.selectedMark} aria-hidden="true">✓</span> : null}
      </span>
      <span className={styles.title}>{title}</span>
      <span className={styles.detail}>{detail}</span>
      <span className={styles.rule} aria-hidden="true" />
    </button>
  )
}
