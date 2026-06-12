import Section from '../../components/Section/Section'
import Reveal from '../../components/Reveal/Reveal'
import BarChart from '../../charts/BarChart'
import type { PointAnnotation } from '../../charts/types'
import githubData from '../../../data/github.json'
import styles from './GitHub.module.css'

interface MonthlyGitHub {
  month: string
  commits: number
  pullRequests: number
  reviews: number
  issues: number
  privateContributions: number
  totalContributions: number
}
interface GithubData {
  monthly: MonthlyGitHub[]
  inflection: { month: string; defaultLabel: string }
  publicReposCreatedInWindow: { name: string }[]
  totalPublicRepos: number
  languages: { name: string; count: number }[]
}

const data = githubData as GithubData

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
const shortLabel = (key: string) => MONTHS[Number(key.split('-')[1]) - 1] ?? key

export default function GitHub() {
  const chartData = data.monthly.map((m) => ({
    label: shortLabel(m.month),
    value: m.totalContributions,
  }))
  const inflectionIndex = data.monthly.findIndex(
    (m) => m.month === data.inflection.month,
  )
  const surge = data.monthly[inflectionIndex]
  const annotations: PointAnnotation[] =
    inflectionIndex >= 0
      ? [
          {
            index: inflectionIndex,
            title: data.inflection.defaultLabel,
            subtitle: `${surge.totalContributions} contributions`,
            dx: -120,
            dy: -24,
          },
        ]
      : []

  const topLanguages = data.languages.slice(0, 3).map((l) => l.name)

  return (
    <Section id="github" eyebrow="Craft · GitHub" title="A year on GitHub">
      <Reveal>
        <p className={styles.lede}>
          Public commits tell only part of the story — most of this year's
          building happened in private repositories. Counting every contribution
          (private as counts only), the shape is unmistakable: a quiet stretch,
          then a sharp ramp as AI-agent workflows took over how I work.
        </p>
      </Reveal>
      <Reveal>
        <BarChart
          data={chartData}
          annotations={annotations}
          ariaLabel="Monthly GitHub contributions, June 2025 to May 2026, with the AI-agent adoption inflection annotated"
        />
      </Reveal>
      <Reveal>
        <ul className={styles.stats}>
          <li>
            <strong>{data.totalPublicRepos}</strong>
            <span>public repositories</span>
          </li>
          <li>
            <strong>{data.publicReposCreatedInWindow.length}</strong>
            <span>new public projects this year</span>
          </li>
          <li>
            <strong>{topLanguages.join(' · ')}</strong>
            <span>most-used languages</span>
          </li>
        </ul>
      </Reveal>
    </Section>
  )
}
