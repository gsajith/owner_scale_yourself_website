import Section from '../../components/Section/Section'
import Reveal from '../../components/Reveal/Reveal'
import MultiLineChart, { type LineSeries } from '../../charts/MultiLineChart'
import LineChart from '../../charts/LineChart'
import bodyData from '../../../data/body.json'
import styles from './Body.module.css'

interface RecompSeries {
  key: string
  unit: string
  delta: number | null
  points: { label: string; value: number | null }[]
}
interface BodyData {
  recomposition: { series: RecompSeries[] }
  sleep: {
    monthly: { label: string; avgHours: number | null }[]
    avgNightlyHours: number | null
    pctNights7plus: number | null
    totalNights: number
  }
}
const data = bodyData as BodyData

const COLORS: Record<string, string> = {
  Weight: '#e8552d',
  'Body fat': '#2f6fb0',
  'Lean mass': '#3f9b6f',
}

function fmtDelta(d: number | null, unit: string) {
  if (d == null) return '—'
  const r = Math.round(d * 10) / 10
  if (r === 0) return `≈0 ${unit}`
  return `${r > 0 ? '+' : '−'}${Math.abs(r)} ${unit}`
}

export default function Body() {
  const recomp = data.recomposition.series
  const weight = recomp.find((s) => s.key === 'Weight')
  const xLabels = recomp[0]?.points.map((p) => p.label) ?? []
  const lineSeries: LineSeries[] = recomp.map((s) => ({
    key: s.key,
    color: COLORS[s.key] ?? 'var(--accent)',
    points: s.points,
  }))
  const sleepData = data.sleep.monthly
    .filter((m) => m.avgHours != null)
    .map((m) => ({ label: m.label, value: m.avgHours as number }))
  const deltaCaption = recomp
    .map((s) => `${s.key.toLowerCase()} ${fmtDelta(s.delta, s.unit)}`)
    .join(', ')

  return (
    <Section id="body" eyebrow="Personal · Health" title="Body & sleep">
      <Reveal>
        <p className={styles.lede}>
          I leaned out this year — down about{' '}
          {Math.abs(Math.round(weight?.delta ?? 0))} pounds — while holding a steady
          sleep schedule just under seven hours a night. Body metrics come from a
          smart scale and my Apple Watch; the body-fat and lean-mass figures are
          bioimpedance estimates, noisier than the scale weight itself.
        </p>
      </Reveal>
      <Reveal>
        <ul className={styles.stats}>
          <li>
            <strong>{fmtDelta(weight?.delta ?? null, 'lb')}</strong>
            <span>body weight</span>
          </li>
          <li>
            <strong>{data.sleep.avgNightlyHours?.toFixed(1)}h</strong>
            <span>avg nightly sleep</span>
          </li>
          <li>
            <strong>{Math.round(data.sleep.pctNights7plus ?? 0)}%</strong>
            <span>nights 7h+</span>
          </li>
          <li>
            <strong>{data.sleep.totalNights}</strong>
            <span>nights tracked</span>
          </li>
        </ul>
      </Reveal>
      <Reveal>
        <h3 className={styles.h3}>Body composition — change since the start</h3>
        <MultiLineChart
          series={lineSeries}
          xLabels={xLabels}
          height={280}
          zeroLine
          ariaLabel="Body weight, body fat, and lean mass as percent change since the start of the window"
        />
        <p className={styles.caption}>
          Normalized to percent change since the first reading (no absolute figures).
          Over the window: {deltaCaption}.
        </p>
      </Reveal>
      <Reveal>
        <h3 className={styles.h3}>Sleep — average hours per night</h3>
        <LineChart
          data={sleepData}
          height={220}
          color="#2f6fb0"
          ariaLabel="Average nightly sleep hours per month"
        />
      </Reveal>
    </Section>
  )
}
