import styles from './CoverCard.module.css'

interface CoverCardProps {
  /** Vendored cover path relative to BASE_URL (e.g. "covers/x.jpg"), or null. */
  cover: string | null
  title: string
  subtitle?: string
  rating?: number | null
  size?: 'lg' | 'sm'
}

/**
 * Book/film cover card with a typographic fallback when no image is available.
 * Reused by the reading and film sections.
 */
export default function CoverCard({
  cover,
  title,
  subtitle,
  rating,
  size = 'sm',
}: CoverCardProps) {
  const stars =
    rating != null
      ? '★'.repeat(Math.round(rating)) + '☆'.repeat(Math.max(0, 5 - Math.round(rating)))
      : null
  return (
    <figure className={`${styles.card} ${styles[size]}`}>
      <div className={styles.coverWrap}>
        {cover ? (
          <img
            className={styles.cover}
            src={`${import.meta.env.BASE_URL}${cover}`}
            alt={title}
          />
        ) : (
          <div className={styles.placeholder}>
            <span>{title}</span>
          </div>
        )}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {stars && <span className={styles.rating}>{stars}</span>}
      </figcaption>
    </figure>
  )
}
