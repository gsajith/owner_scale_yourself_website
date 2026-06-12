import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { scalePoint, scaleLinear } from '@visx/scale'
import { AxisBottom } from '@visx/axis'
import ResponsiveChart from './ResponsiveChart'
import styles from './StackedBarChart.module.css'

export interface LinePoint {
  label: string
  value: number | null
}
export interface LineSeries {
  key: string
  color: string
  points: LinePoint[]
}
interface MultiLineChartProps {
  series: LineSeries[]
  /** Shared x-axis labels (all categories, in order). */
  xLabels: string[]
  height?: number
  ariaLabel?: string
  /** Draw a reference line at y=0 (useful for normalized "% change" series). */
  zeroLine?: boolean
}

const MARGIN = { top: 12, right: 12, bottom: 28, left: 36 }

/**
 * Generic multi-series line chart with a legend. Null points are bridged (the line
 * connects defined points across gaps). Reused for normalized trend comparisons.
 */
export default function MultiLineChart({
  series,
  xLabels,
  height = 300,
  ariaLabel,
  zeroLine = false,
}: MultiLineChartProps) {
  const values = series.flatMap((s) =>
    s.points.map((p) => p.value).filter((v): v is number => v != null),
  )
  const minV = Math.min(0, ...values)
  const maxV = Math.max(0, ...values)
  return (
    <div>
      <ResponsiveChart height={height}>
        {({ width }) => {
          const innerW = Math.max(0, width - MARGIN.left - MARGIN.right)
          const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom)
          const x = scalePoint({ domain: xLabels, range: [0, innerW], padding: 0.5 })
          const y = scaleLinear({
            domain: [minV, maxV],
            range: [innerH, 0],
            nice: true,
          })
          return (
            <svg width={width} height={height} role="img" aria-label={ariaLabel}>
              <Group left={MARGIN.left} top={MARGIN.top}>
                {zeroLine && (
                  <line
                    x1={0}
                    x2={innerW}
                    y1={y(0)}
                    y2={y(0)}
                    stroke="var(--ink-soft)"
                    strokeDasharray="3 3"
                    opacity={0.4}
                  />
                )}
                {series.map((s) => {
                  const defined = s.points.filter((p) => p.value != null)
                  return (
                    <g key={s.key}>
                      <LinePath
                        data={defined}
                        x={(p) => x(p.label) ?? 0}
                        y={(p) => y(p.value as number)}
                        stroke={s.color}
                        strokeWidth={2.5}
                      />
                      {defined.map((p) => (
                        <circle
                          key={p.label}
                          cx={x(p.label) ?? 0}
                          cy={y(p.value as number)}
                          r={3}
                          fill={s.color}
                        />
                      ))}
                    </g>
                  )
                })}
                <AxisBottom
                  top={innerH}
                  scale={x}
                  hideTicks
                  stroke="var(--ink-soft)"
                  tickLabelProps={() => ({
                    fill: 'var(--ink-soft)',
                    fontSize: 11,
                    textAnchor: 'middle',
                  })}
                />
              </Group>
            </svg>
          )
        }}
      </ResponsiveChart>
      <ul className={styles.legend}>
        {series.map((s) => (
          <li key={s.key}>
            <span className={styles.swatch} style={{ background: s.color }} />
            {s.key}
          </li>
        ))}
      </ul>
    </div>
  )
}
