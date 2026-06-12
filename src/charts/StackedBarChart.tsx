import { Group } from '@visx/group'
import { Bar } from '@visx/shape'
import { scaleBand, scaleLinear } from '@visx/scale'
import { AxisBottom } from '@visx/axis'
import ResponsiveChart from './ResponsiveChart'
import styles from './StackedBarChart.module.css'

export interface StackSeries {
  key: string
  color: string
}
export interface StackDatum {
  label: string
  segments: Record<string, number>
}
interface StackedBarChartProps {
  data: StackDatum[]
  series: StackSeries[]
  height?: number
  ariaLabel?: string
}

const MARGIN = { top: 12, right: 12, bottom: 28, left: 12 }

/**
 * Generic stacked monthly bar chart with a legend. Each datum carries a `segments`
 * map keyed by series key; series render bottom-up in array order. SVG + a small
 * HTML legend, both print-clean. Reused for category breakdowns (workouts, etc.).
 */
export default function StackedBarChart({
  data,
  series,
  height = 300,
  ariaLabel,
}: StackedBarChartProps) {
  const maxTotal = Math.max(
    1,
    ...data.map((d) => series.reduce((s, se) => s + (d.segments[se.key] || 0), 0)),
  )
  return (
    <div>
      <ResponsiveChart height={height}>
        {({ width }) => {
          const innerW = Math.max(0, width - MARGIN.left - MARGIN.right)
          const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom)
          const x = scaleBand({
            domain: data.map((d) => d.label),
            range: [0, innerW],
            padding: 0.3,
          })
          const y = scaleLinear({
            domain: [0, maxTotal],
            range: [innerH, 0],
            nice: true,
          })
          return (
            <svg width={width} height={height} role="img" aria-label={ariaLabel}>
              <Group left={MARGIN.left} top={MARGIN.top}>
                {data.map((d) => {
                  let base = 0
                  return (
                    <g key={d.label}>
                      {series.map((se) => {
                        const v = d.segments[se.key] || 0
                        if (v <= 0) return null
                        const top = base + v
                        const rectY = y(top) ?? 0
                        const rectH = (y(base) ?? innerH) - rectY
                        base = top
                        return (
                          <Bar
                            key={se.key}
                            x={x(d.label) ?? 0}
                            y={rectY}
                            width={x.bandwidth()}
                            height={rectH}
                            fill={se.color}
                          />
                        )
                      })}
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
        {series.map((se) => (
          <li key={se.key}>
            <span className={styles.swatch} style={{ background: se.color }} />
            {se.key}
          </li>
        ))}
      </ul>
    </div>
  )
}
