interface ChartAnnotationProps {
  /** Anchor point in chart pixel coordinates. */
  x: number
  y: number
  /** Label box offset from the anchor, in px (box sits up-left by default). */
  dx?: number
  dy?: number
  title: string
  subtitle?: string
}

const BOX_W = 176

/**
 * Reusable point-anchored callout, drawn as plain SVG (circle subject + connector +
 * dark label box). Pure SVG so it renders identically on screen and in the PDF, with
 * no charting-library label quirks. Used by every chart that calls out a point.
 */
export default function ChartAnnotation({
  x,
  y,
  dx = -196,
  dy = -52,
  title,
  subtitle,
}: ChartAnnotationProps) {
  const boxX = x + dx
  const boxY = y + dy
  const boxH = subtitle ? 50 : 32
  // Connector runs from the data point to the box's right-middle edge.
  const connectorX = boxX + BOX_W
  const connectorY = boxY + boxH / 2
  return (
    <g>
      <line
        x1={x}
        y1={y}
        x2={connectorX}
        y2={connectorY}
        stroke="var(--ink)"
        strokeWidth={1}
      />
      <circle cx={x} cy={y} r={5} fill="#ffffff" stroke="var(--ink)" strokeWidth={2} />
      <rect x={boxX} y={boxY} width={BOX_W} height={boxH} rx={6} fill="var(--ink)" />
      <text
        x={boxX + 12}
        y={boxY + 20}
        fill="#ffffff"
        fontSize={13}
        fontWeight={600}
        fontFamily="var(--font-sans)"
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={boxX + 12}
          y={boxY + 38}
          fill="#ffffff"
          fillOpacity={0.85}
          fontSize={11}
          fontFamily="var(--font-sans)"
        >
          {subtitle}
        </text>
      )}
    </g>
  )
}
