import { Fragment } from 'react'
import Section from '../../components/Section/Section'
import Reveal from '../../components/Reveal/Reveal'
import github from '../../../data/github.json'
import agent from '../../../data/agent.json'
import training from '../../../data/training.json'
import body from '../../../data/body.json'
import reading from '../../../data/reading.json'
import film from '../../../data/film.json'
import styles from './Overview.module.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const windowMonths: { key: string; label: string }[] = []
for (let i = 0; i < 12; i++) {
  const idx = 5 + i
  const y = 2025 + Math.floor(idx / 12)
  const m = idx % 12
  windowMonths.push({ key: `${y}-${String(m + 1).padStart(2, '0')}`, label: MONTHS[m] })
}

interface MonthRecord {
  month: string
}
function toMap<T extends MonthRecord>(arr: T[], value: (x: T) => number | null) {
  return new Map(arr.map((x) => [x.month, value(x)]))
}
const workoutsTotal = (m: { workouts: Record<string, number> }) =>
  Object.values(m.workouts).reduce((a, b) => a + b, 0)

interface RowDef {
  label: string
  map: Map<string, number | null>
  fmt: (v: number) => string
  /** Treat a 0 as "no data" (used for the lifting gap). */
  nullIfZero?: boolean
}

const rows: RowDef[] = [
  {
    label: 'GitHub contributions',
    map: toMap(github.monthly, (m) => m.totalContributions),
    fmt: (v) => v.toLocaleString('en-US'),
  },
  {
    label: 'AI tokens',
    map: toMap(agent.monthly, (m) => m.tokens),
    fmt: (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}k`),
  },
  {
    label: 'Films watched',
    map: toMap(film.monthly, (m) => m.count),
    fmt: (v) => String(v),
  },
  {
    label: 'Books finished',
    map: toMap(reading.monthly, (m) => m.count),
    fmt: (v) => String(v),
  },
  {
    label: 'Workouts',
    map: toMap(training.monthly, workoutsTotal),
    fmt: (v) => String(v),
  },
  {
    label: 'Lifting volume',
    map: toMap(training.monthly, (m) => m.liftVolume),
    fmt: (v) => `${Math.round(v / 1000)}k`,
    nullIfZero: true,
  },
  {
    label: 'Steps',
    map: toMap(training.monthly, (m) => m.steps),
    fmt: (v) => `${Math.round(v / 1000)}k`,
  },
  {
    label: 'Sleep',
    map: toMap(body.sleep.monthly, (m) => m.avgHours),
    fmt: (v) => `${v.toFixed(1)}h`,
  },
]

export default function Overview() {
  return (
    <Section
      id="overview"
      eyebrow="The year at a glance"
      title="Twelve months, every signal"
    >
      <Reveal>
        <p className={styles.lede}>
          Every metric in this report, month by month. Darker means more; a hatched
          cell means no data that month — the silences are honest (the lifting tracker
          went offline; agent logs only reach back so far).
        </p>
      </Reveal>
      <Reveal>
        <div
          className={styles.grid}
          role="img"
          aria-label="Month-by-month heatmap of every metric across June 2025 to May 2026; darker cells are higher values, hatched cells are months with no data"
        >
          <div className={styles.corner} aria-hidden="true" />
          {windowMonths.map((c) => (
            <div key={c.key} className={styles.colHead}>
              {c.label}
            </div>
          ))}
          {rows.map((row) => {
            const vals = windowMonths.map((c) => {
              const raw = row.map.get(c.key)
              return row.nullIfZero && raw === 0 ? null : (raw ?? null)
            })
            const max = Math.max(1, ...vals.filter((v): v is number => v != null))
            return (
              <Fragment key={row.label}>
                <div className={styles.rowLabel}>{row.label}</div>
                {vals.map((v, i) =>
                  v == null ? (
                    <div
                      key={windowMonths[i].key}
                      className={styles.cellEmpty}
                      title={`${row.label} · ${windowMonths[i].label}: no data`}
                    />
                  ) : (
                    <div
                      key={windowMonths[i].key}
                      className={styles.cell}
                      style={{
                        background: `color-mix(in srgb, var(--accent) ${Math.round(
                          12 + 80 * (v / max),
                        )}%, transparent)`,
                      }}
                      title={`${row.label} · ${windowMonths[i].label}: ${row.fmt(v)}`}
                    />
                  ),
                )}
              </Fragment>
            )
          })}
        </div>
      </Reveal>
    </Section>
  )
}
