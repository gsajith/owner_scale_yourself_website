import { Group } from '@visx/group'
import { Bar } from '@visx/shape'
import { scaleBand, scaleLinear } from '@visx/scale'
import { AxisBottom } from '@visx/axis'
import ResponsiveChart from './ResponsiveChart'
import ChartAnnotation from './ChartAnnotation'
import type { ChartDatum, PointAnnotation } from './types'

interface BarChartProps {
  data: ChartDatum[]
  height?: number
  color?: string
  annotations?: PointAnnotation[]
  ariaLabel?: string
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 16 }

/**
 * Generic monthly bar chart with optional point-anchored annotations. Reused by
 * every section that shows a monthly count. SVG output is print-clean.
 */
export default function BarChart({
  data,
  height = 320,
  color = 'var(--accent)',
  annotations = [],
  ariaLabel,
}: BarChartProps) {
  return (
    <ResponsiveChart height={height}>
      {({ width }) => {
        const innerW = Math.max(0, width - MARGIN.left - MARGIN.right)
        const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom)
        const x = scaleBand({
          domain: data.map((d) => d.label),
          range: [0, innerW],
          padding: 0.3,
        })
        const maxValue = Math.max(1, ...data.map((d) => d.value))
        const y = scaleLinear({
          domain: [0, maxValue],
          range: [innerH, 0],
          nice: true,
        })
        return (
          <svg width={width} height={height} role="img" aria-label={ariaLabel}>
            <Group left={MARGIN.left} top={MARGIN.top}>
              {data.map((d) => {
                const barY = y(d.value) ?? innerH
                return (
                  <Bar
                    key={d.label}
                    x={x(d.label) ?? 0}
                    y={barY}
                    width={x.bandwidth()}
                    height={innerH - barY}
                    fill={color}
                    rx={3}
                  />
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
              {annotations.map((a) => {
                const d = data[a.index]
                if (!d) return null
                return (
                  <ChartAnnotation
                    key={a.index}
                    x={(x(d.label) ?? 0) + x.bandwidth() / 2}
                    y={y(d.value) ?? 0}
                    dx={a.dx}
                    dy={a.dy}
                    title={a.title}
                    subtitle={a.subtitle}
                  />
                )
              })}
            </Group>
          </svg>
        )
      }}
    </ResponsiveChart>
  )
}
