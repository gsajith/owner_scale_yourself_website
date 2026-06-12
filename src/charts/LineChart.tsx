import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { scalePoint, scaleLinear } from '@visx/scale'
import { AxisBottom } from '@visx/axis'
import ResponsiveChart from './ResponsiveChart'
import ChartAnnotation from './ChartAnnotation'
import type { ChartDatum, PointAnnotation } from './types'

interface LineChartProps {
  data: ChartDatum[]
  height?: number
  color?: string
  annotations?: PointAnnotation[]
  ariaLabel?: string
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 16 }

/**
 * Generic monthly line chart with optional point-anchored annotations. Shares scale
 * and axis conventions with BarChart; reused by trend sections (#9–#14).
 */
export default function LineChart({
  data,
  height = 320,
  color = 'var(--accent)',
  annotations = [],
  ariaLabel,
}: LineChartProps) {
  return (
    <ResponsiveChart height={height}>
      {({ width }) => {
        const innerW = Math.max(0, width - MARGIN.left - MARGIN.right)
        const innerH = Math.max(0, height - MARGIN.top - MARGIN.bottom)
        const x = scalePoint({
          domain: data.map((d) => d.label),
          range: [0, innerW],
          padding: 0.5,
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
              <LinePath
                data={data}
                x={(d) => x(d.label) ?? 0}
                y={(d) => y(d.value) ?? 0}
                stroke={color}
                strokeWidth={2.5}
              />
              {data.map((d) => (
                <circle
                  key={d.label}
                  cx={x(d.label) ?? 0}
                  cy={y(d.value) ?? 0}
                  r={3}
                  fill={color}
                />
              ))}
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
                    x={x(d.label) ?? 0}
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
