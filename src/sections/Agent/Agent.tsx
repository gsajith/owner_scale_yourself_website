import Section from '../../components/Section/Section'
import Reveal from '../../components/Reveal/Reveal'
import BarChart from '../../charts/BarChart'
import type { PointAnnotation } from '../../charts/types'
import agentData from '../../../data/agent.json'
import styles from './Agent.module.css'

interface AgentData {
  dataHorizon: { first: string; last: string }
  monthly: { month: string; tokens: number; sessions: number }[]
  totals: {
    sessions: number
    tokens: number
    distinctTools: number
    distinctMcpServers: number
    distinctSkills: number
    distinctProjects: number
  }
  topSkills: { name: string; count: number }[]
}
const data = agentData as AgentData

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
const shortMonth = (key: string) => {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} '${y.slice(2)}`
}
// Strip plugin namespace prefixes (e.g. "superpowers:writing-plans" → "writing-plans").
const shortSkill = (name: string) =>
  name.includes(':') ? name.split(':').pop()! : name
const fmtTokens = (t: number) => `${(t / 1e6).toFixed(1)}M`

export default function Agent() {
  const tokenData = data.monthly.map((m) => ({
    label: shortMonth(m.month),
    value: m.tokens,
  }))
  const rampIndex = tokenData.length - 1
  const annotations: PointAnnotation[] =
    rampIndex > 0
      ? [
          {
            index: rampIndex,
            title: 'Going all-in',
            subtitle: `${fmtTokens(data.monthly[rampIndex].tokens)} tokens`,
            dx: -150,
            dy: 12,
          },
        ]
      : []
  const maxSkill = Math.max(...data.topSkills.map((s) => s.count))

  return (
    <Section id="agent" eyebrow="Craft · AI agents" title="Working with agents">
      <Reveal>
        <p className={styles.lede}>
          My Claude Code history only reaches back to {shortMonth(data.dataHorizon.first)},
          so this is a snapshot of how I work with agents right now — not a year-long
          trend. Even in that short window the footprint is heavy: I drive agents across
          projects with a toolkit of custom skills and the Playwright MCP, treating them
          as collaborators rather than autocomplete.
        </p>
      </Reveal>
      <Reveal>
        <ul className={styles.stats}>
          <li>
            <strong>{data.totals.sessions}</strong>
            <span>agent sessions</span>
          </li>
          <li>
            <strong>{fmtTokens(data.totals.tokens)}</strong>
            <span>tokens</span>
          </li>
          <li>
            <strong>{data.totals.distinctSkills}</strong>
            <span>skills wielded</span>
          </li>
          <li>
            <strong>{data.totals.distinctTools}</strong>
            <span>distinct tools</span>
          </li>
        </ul>
      </Reveal>
      <div className={styles.grid}>
        <Reveal className={styles.col}>
          <h3 className={styles.h3}>Tokens per month</h3>
          <BarChart
            data={tokenData}
            height={260}
            annotations={annotations}
            ariaLabel="Agent tokens used per month"
          />
        </Reveal>
        <Reveal className={styles.col}>
          <h3 className={styles.h3}>Most-used skills</h3>
          <ul className={styles.skills}>
            {data.topSkills.map((s) => (
              <li key={s.name}>
                <span className={styles.skillName} title={s.name}>
                  {shortSkill(s.name)}
                </span>
                <span className={styles.track}>
                  <span
                    className={styles.fill}
                    style={{ width: `${(s.count / maxSkill) * 100}%` }}
                  />
                </span>
                <span className={styles.skillCount}>{s.count}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  )
}
