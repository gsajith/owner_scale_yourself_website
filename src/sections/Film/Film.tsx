import Section from '../../components/Section/Section'
import Reveal from '../../components/Reveal/Reveal'
import BarChart from '../../charts/BarChart'
import CoverCard from '../../components/CoverCard/CoverCard'
import type { PointAnnotation } from '../../charts/types'
import filmData from '../../../data/film.json'
import styles from './Film.module.css'

interface Film {
  title: string
  year: string
  rating: number | null
  monthLabel?: string
  poster: string | null
}
interface FilmData {
  monthly: { label: string; count: number }[]
  favorites: Film[]
  films: Film[]
  totals: {
    films: number
    withPoster: number
    avgRating: number | null
    favorites: number
  }
}
const data = filmData as FilmData

export default function Film() {
  const chartData = data.monthly.map((m) => ({ label: m.label, value: m.count }))
  const peakIndex = data.monthly.reduce(
    (best, m, i, arr) => (m.count > arr[best].count ? i : best),
    0,
  )
  const annotations: PointAnnotation[] = [
    {
      index: peakIndex,
      title: 'Peak month',
      subtitle: `${data.monthly[peakIndex].count} films`,
      dx: peakIndex > 6 ? -130 : 24,
      dy: -10,
    },
  ]
  const perMonth = (data.totals.films / 12).toFixed(1)
  const wall = data.films.filter((f) => f.poster)

  return (
    <Section id="film" eyebrow="Personal · Film" title="Film">
      <Reveal>
        <p className={styles.lede}>
          The year I went deep on cinema — {data.totals.films} films across the window,
          roughly {perMonth} a month, from arthouse to horror to wuxia. Time between
          roles, spent in the dark.
        </p>
      </Reveal>
      <Reveal>
        <ul className={styles.stats}>
          <li>
            <strong>{data.totals.films}</strong>
            <span>films watched</span>
          </li>
          <li>
            <strong>{perMonth}</strong>
            <span>per month</span>
          </li>
          <li>
            <strong>
              {data.totals.avgRating != null
                ? `${data.totals.avgRating.toFixed(1)}★`
                : '—'}
            </strong>
            <span>avg rating</span>
          </li>
        </ul>
      </Reveal>
      <Reveal>
        <h3 className={styles.h3}>Films per month</h3>
        <BarChart
          data={chartData}
          height={240}
          annotations={annotations}
          ariaLabel="Films watched per month, June 2025 to May 2026"
        />
      </Reveal>
      <Reveal>
        <h3 className={styles.h3}>Favorites</h3>
        <div className={styles.favorites}>
          {data.favorites.map((f) => (
            <CoverCard
              key={`${f.title}-${f.year}`}
              cover={f.poster}
              title={f.title}
              subtitle={f.year}
              rating={f.rating}
              size="lg"
            />
          ))}
        </div>
      </Reveal>
      <Reveal>
        <h3 className={styles.h3}>Everything I watched</h3>
        <div className={styles.wall}>
          {wall.map((f, i) => (
            <img
              key={`${f.title}-${f.year}-${i}`}
              className={styles.poster}
              src={`${import.meta.env.BASE_URL}${f.poster}`}
              alt={`${f.title} (${f.year})`}
            />
          ))}
        </div>
      </Reveal>
    </Section>
  )
}
