// Builds monthly body-composition + sleep data from the Apple Health export.
// Body metrics are NORMALIZED to % change since the first in-window reading (no
// absolute vanity numbers, per the privacy decision); only signed deltas are shown.
// Sleep is aggregated to average nightly asleep-hours per month. Writes data/body.json.
import { createReadStream, existsSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

function findExport() {
  for (const c of [
    process.env.RAW_DATA_DIR,
    resolve(root, 'data/raw'),
    resolve(root, '../../../data/raw'),
  ]) {
    if (c && existsSync(resolve(c, 'apple_health_export/export.xml')))
      return resolve(c, 'apple_health_export/export.xml')
  }
  return null
}
const exportXml = findExport()
if (!exportXml) {
  console.error('Could not locate apple_health_export/export.xml')
  process.exit(1)
}

const monthKeys = []
for (let i = 0; i < 12; i++) {
  const idx = 5 + i
  const y = 2025 + Math.floor(idx / 12)
  const m = (idx % 12) + 1
  monthKeys.push(`${y}-${String(m).padStart(2, '0')}`)
}
const inWindow = (k) => monthKeys.includes(k)

// "2025-06-12 08:30:00 -0400" -> ms epoch (offset-aware). Returns NaN if unparseable.
function toMillis(s) {
  const m = s?.match(
    /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-]\d{2})(\d{2})/,
  )
  if (!m) return NaN
  return Date.parse(
    `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7]}:${m[8]}`,
  )
}

const BODY_TYPES = {
  HKQuantityTypeIdentifierBodyMass: 'weight',
  HKQuantityTypeIdentifierBodyFatPercentage: 'bodyFat',
  HKQuantityTypeIdentifierLeanBodyMass: 'lean',
}
// metric -> month -> {sum,count}
const body = Object.fromEntries(
  Object.values(BODY_TYPES).map((k) => [k, new Map()]),
)
const nightHours = new Map() // nightDate (YYYY-MM-DD) -> asleep hours

const rl = createInterface({
  input: createReadStream(exportXml),
  crlfDelay: Infinity,
})
for await (const line of rl) {
  if (line.includes('HKQuantityTypeIdentifierBody') || line.includes('LeanBodyMass')) {
    const type = line.match(/type="([^"]+)"/)?.[1]
    const metric = BODY_TYPES[type]
    if (!metric) continue
    const start = line.match(/startDate="([^"]+)"/)?.[1]
    let value = Number(line.match(/ value="([^"]+)"/)?.[1])
    if (!start || !Number.isFinite(value)) continue
    // Apple Health stores body-fat % as a fraction (0.20). Convert to percentage
    // points so deltas read in points, not hundredths.
    if (metric === 'bodyFat') value *= 100
    const month = start.slice(0, 7)
    if (!inWindow(month)) continue
    const map = body[metric]
    const cur = map.get(month) || { sum: 0, count: 0 }
    cur.sum += value
    cur.count++
    map.set(month, cur)
  } else if (line.includes('HKCategoryTypeIdentifierSleepAnalysis')) {
    const value = line.match(/value="([^"]+)"/)?.[1] ?? ''
    if (!value.includes('Asleep')) continue // exclude InBed / Awake
    const start = line.match(/startDate="([^"]+)"/)?.[1]
    const end = line.match(/endDate="([^"]+)"/)?.[1]
    const a = toMillis(start)
    const b = toMillis(end)
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) continue
    // Night-date: early-morning sleep (local hour < 18) belongs to the previous day.
    const lm = start.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2})/)
    if (!lm) continue
    let nightDate = `${lm[1]}-${lm[2]}-${lm[3]}`
    if (Number(lm[4]) < 18) {
      const d = new Date(`${nightDate}T00:00:00Z`)
      d.setUTCDate(d.getUTCDate() - 1)
      nightDate = d.toISOString().slice(0, 10)
    }
    if (!inWindow(nightDate.slice(0, 7))) continue
    nightHours.set(nightDate, (nightHours.get(nightDate) || 0) + (b - a) / 3.6e6)
  }
}

// ---- recomposition: monthly means -> % change since baseline ----
function buildSeries(metric, unit) {
  const map = body[metric]
  const means = monthKeys.map((k) => {
    const c = map.get(k)
    return c && c.count ? c.sum / c.count : null
  })
  const firstIdx = means.findIndex((v) => v != null)
  const baseline = firstIdx >= 0 ? means[firstIdx] : null
  let lastVal = null
  for (let i = means.length - 1; i >= 0; i--) {
    if (means[i] != null) {
      lastVal = means[i]
      break
    }
  }
  const points = monthKeys.map((k, i) => ({
    label: shortMonth(k),
    value:
      baseline != null && means[i] != null
        ? ((means[i] - baseline) / baseline) * 100
        : null,
  }))
  const delta = baseline != null && lastVal != null ? lastVal - baseline : null
  return { unit, delta, points }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function shortMonth(key) {
  return MONTHS[Number(key.split('-')[1]) - 1] ?? key
}

const recomposition = {
  series: [
    { key: 'Weight', ...buildSeries('weight', 'lb') },
    { key: 'Body fat', ...buildSeries('bodyFat', 'pts') },
    { key: 'Lean mass', ...buildSeries('lean', 'lb') },
  ],
  note: 'Normalized to % change since the first in-window reading; only signed deltas are surfaced.',
}

// ---- sleep: per-month average nightly asleep hours ----
const sleepMonthAgg = new Map(monthKeys.map((k) => [k, { sum: 0, nights: 0 }]))
let totalNights = 0
let nights7plus = 0
let totalAsleepHours = 0
for (const [nd, hours] of nightHours) {
  const month = nd.slice(0, 7)
  if (!inWindow(month)) continue
  const agg = sleepMonthAgg.get(month)
  agg.sum += hours
  agg.nights++
  totalNights++
  totalAsleepHours += hours
  if (hours >= 7) nights7plus++
}
const sleepMonthly = monthKeys.map((k) => {
  const a = sleepMonthAgg.get(k)
  return {
    month: k,
    label: shortMonth(k),
    avgHours: a.nights ? a.sum / a.nights : null,
  }
})
const allHours = sleepMonthly.filter((m) => m.avgHours != null)
const avgNightlyHours = totalNights ? totalAsleepHours / totalNights : null

const data = {
  window: { from: `${monthKeys[0]}-01`, to: `${monthKeys[11]}-31` },
  recomposition,
  sleep: {
    monthly: sleepMonthly,
    avgNightlyHours,
    pctNights7plus: totalNights ? (nights7plus / totalNights) * 100 : null,
    totalNights,
  },
}

await mkdir(resolve(root, 'data'), { recursive: true })
const out = resolve(root, 'data/body.json')
await writeFile(out, JSON.stringify(data, null, 2) + '\n')
console.log(`Wrote ${out}`)
console.log(
  `  deltas: ${recomposition.series.map((s) => `${s.key} ${s.delta?.toFixed(1)}${s.unit}`).join(', ')} · ` +
    `sleep: ${avgNightlyHours?.toFixed(1)}h avg over ${totalNights} nights (${allHours.length} months)`,
)
