import Section from '../../components/Section/Section'
import Reveal from '../../components/Reveal/Reveal'
import BarChart from '../../charts/BarChart'
import StackedBarChart, { type StackSeries } from '../../charts/StackedBarChart'
import type { PointAnnotation } from '../../charts/types'
import trainingData from '../../../data/training.json'
import styles from './Training.module.css'

interface MonthlyTraining {
  month: string
  liftSessions: number
  liftVolume: number
  liftPRs: number
  steps: number
  workouts: Record<string, number>
}
interface TrainingData {
  workoutCategories: string[]
  monthly: MonthlyTraining[]
  liftingCoverage: { first: string; last: string }
  totals: {
    liftSessions: number
    liftVolume: number
    liftPRs: number
    steps: number
    workouts: number
  }
}
const data = trainingData as TrainingData

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
const shortMonth = (key: string) => MONTHS[Number(key.split('-')[1]) - 1] ?? key

// Restrained category palette (refined in the #15 design pass).
const SERIES: StackSeries[] = [
  { key: 'Walking', color: '#e8552d' },
  { key: 'Badminton', color: '#2f6fb0' },
  { key: 'HIIT', color: '#e0a52e' },
  { key: 'Running', color: '#3f9b6f' },
  { key: 'Cycling', color: '#8a6fb8' },
  { key: 'Other', color: '#b8b2a8' },
]

const fmtInt = (n: number) => n.toLocaleString('en-US')
const fmtM = (n: number) => `${(n / 1e6).toFixed(1)}M`

export default function Training() {
  const workoutData = data.monthly.map((m) => ({
    label: shortMonth(m.month),
    segments: m.workouts,
  }))
  const volumeData = data.monthly.map((m) => ({
    label: shortMonth(m.month),
    value: m.liftVolume,
  }))
  // Annotate the peak lifting month (June 2025).
  const peakIndex = data.monthly.reduce(
    (best, m, i, arr) => (m.liftVolume > arr[best].liftVolume ? i : best),
    0,
  )
  const annotations: PointAnnotation[] =
    data.monthly[peakIndex].liftVolume > 0
      ? [
          {
            index: peakIndex,
            title: 'Peak block',
            subtitle: `${data.monthly[peakIndex].liftPRs} PRs`,
            dx: 28,
            dy: -8,
          },
        ]
      : []

  return (
    <Section id="training" eyebrow="Personal · Fitness" title="Training">
      <Reveal>
        <p className={styles.lede}>
          Movement was the constant this year — walking nearly every day, regular
          badminton, and a winter block of HIIT. Strength training I logged in
          RepTracker, an app I built myself, until its database went offline in July;
          the silent months after aren't zero-effort, just unlogged here.
        </p>
      </Reveal>
      <Reveal>
        <ul className={styles.stats}>
          <li>
            <strong>{fmtInt(data.totals.workouts)}</strong>
            <span>workouts logged</span>
          </li>
          <li>
            <strong>{fmtM(data.totals.steps)}</strong>
            <span>steps</span>
          </li>
          <li>
            <strong>{data.totals.liftSessions}</strong>
            <span>lifting sessions</span>
          </li>
          <li>
            <strong>{data.totals.liftPRs}</strong>
            <span>lifting PRs</span>
          </li>
        </ul>
      </Reveal>
      <Reveal>
        <h3 className={styles.h3}>Workouts by type</h3>
        <StackedBarChart
          data={workoutData}
          series={SERIES}
          height={300}
          ariaLabel="Monthly workouts by type, June 2025 to May 2026"
        />
      </Reveal>
      <Reveal>
        <h3 className={styles.h3}>Lifting volume</h3>
        <BarChart
          data={volumeData}
          height={240}
          annotations={annotations}
          ariaLabel="Monthly lifting volume — logged June and July 2025, then the tracker went offline"
        />
        <p className={styles.caption}>
          Logged in RepTracker through July 2025, when the database went offline. The
          empty months reflect missing logs, not missing effort.
        </p>
      </Reveal>
    </Section>
  )
}
