import { type ReactNode } from 'react'
import styles from './Section.module.css'

interface SectionProps {
  id?: string
  eyebrow?: string
  title?: string
  children?: ReactNode
  className?: string
}

/**
 * Standard report section wrapper: consistent max-width, padding, and an optional
 * eyebrow + title header. Later sections (#8–#16) compose their charts inside this.
 */
export default function Section({
  id,
  eyebrow,
  title,
  children,
  className,
}: SectionProps) {
  const classes = [styles.section, className].filter(Boolean).join(' ')
  return (
    <section id={id} className={classes}>
      <div className={styles.inner}>
        {(eyebrow || title) && (
          <header className={styles.header}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <h2 className={styles.title}>{title}</h2>}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
