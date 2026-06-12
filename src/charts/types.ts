export interface ChartDatum {
  /** Display label for the x-axis (e.g. "Jun"). */
  label: string
  value: number
}

/** A callout anchored to a specific data point (by index into the data array). */
export interface PointAnnotation {
  index: number
  title: string
  subtitle?: string
  /** Label box offset from the anchored point, in px. */
  dx?: number
  dy?: number
}
