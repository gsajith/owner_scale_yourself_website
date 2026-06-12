import { ParentSize } from '@visx/responsive'
import { type ReactNode } from 'react'

interface ResponsiveChartProps {
  height: number
  children: (dims: { width: number; height: number }) => ReactNode
}

/**
 * Gives a chart a measured width at a fixed height. debounceTime 0 so the Playwright
 * PDF render (which doesn't linger) measures immediately rather than after a debounce.
 */
export default function ResponsiveChart({
  height,
  children,
}: ResponsiveChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ParentSize debounceTime={0}>
        {({ width }) => (width > 0 ? children({ width, height }) : null)}
      </ParentSize>
    </div>
  )
}
