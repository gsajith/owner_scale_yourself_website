// Builds monthly training data for the report window from two sources:
//  - reptracker CSVs (data/raw/reptracker_*.csv): lifting sessions, volume, PRs
//  - Apple Health export.xml (streamed): non-strength workouts by type + steps
// Strength workouts in Apple Health are EXCLUDED to avoid double-counting reptracker.
// Writes data/training.json. Lifting only covers Jun–Jul 2025 within the window
// (the reptracker DB paused after) — the gap is preserved honestly as empty months.
import { createReadStream } from 'node:fs'
import { existsSync, readFileSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

function findRawDir() {
  for (const c of [
    process.env.RAW_DATA_DIR,
    resolve(root, 'data/raw'),
    resolve(root, '../../../data/raw'),
  ]) {
    if (c && existsSync(resolve(c, 'reptracker_workouts.csv'))) return c
  }
  return null
}
const rawDir = findRawDir()
if (!rawDir) {
  console.error('Could not locate data/raw with reptracker CSVs.')
  process.exit(1)
}

// Window: June 2025 .. May 2026 inclusive.
const monthKeys = []
for (let i = 0; i < 12; i++) {
  const idx = 5 + i
  const y = 2025 + Math.floor(idx / 12)
  const m = (idx % 12) + 1
  monthKeys.push(`${y}-${String(m).padStart(2, '0')}`)
}
const inWindow = (k) => monthKeys.includes(k)

const CATEGORIES = ['Walking', 'Badminton', 'Running', 'Cycling', 'HIIT', 'Other']
const monthly = new Map(
  monthKeys.map((k) => [
    k,
    {
      liftSessions: 0,
      liftVolume: 0,
      liftPRs: 0,
      steps: 0,
      workouts: Object.fromEntries(CATEGORIES.map((c) => [c, 0])),
    },
  ]),
)

// ---- minimal CSV (handles quoted "{...}" array fields) ----
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else q = false
      } else cur += c
    } else if (c === '"') q = true
    else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}
const parseArr = (s) =>
  !s || s === '{}' ? [] : s.replace(/^\{|\}$/g, '').split(',').filter(Boolean)

function readCsv(name) {
  const lines = readFileSync(resolve(rawDir, name), 'utf8').split('\n').filter(Boolean)
  const header = parseCsvLine(lines[0])
  return lines.slice(1).map((l) => {
    const cells = parseCsvLine(l)
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']))
  })
}

// ---- lifting (reptracker) ----
const exercisesById = new Map()
for (const r of readCsv('reptracker_exercises.csv')) {
  exercisesById.set(r.id, {
    name: r.name,
    reps: parseArr(r.reps).map(Number),
    weights: parseArr(r.weights).map(Number),
  })
}
const sessions = readCsv('reptracker_workouts.csv')
  .map((w) => ({
    start: w.start_time,
    month: w.start_time.slice(0, 7),
    exerciseIds: parseArr(w.exercises),
  }))
  .sort((a, b) => a.start.localeCompare(b.start))

const bestWeight = new Map() // exercise name -> best max weight seen
let liftFirst = null
let liftLast = null
for (const s of sessions) {
  let volume = 0
  let prs = 0
  for (const id of s.exerciseIds) {
    const ex = exercisesById.get(id)
    if (!ex) continue
    for (let i = 0; i < ex.reps.length; i++) {
      volume += (ex.reps[i] || 0) * (ex.weights[i] || 0)
    }
    const maxW = ex.weights.length ? Math.max(...ex.weights) : 0
    if (maxW > 0 && maxW > (bestWeight.get(ex.name) ?? 0)) {
      bestWeight.set(ex.name, maxW)
      prs++
    }
  }
  if (inWindow(s.month)) {
    const b = monthly.get(s.month)
    b.liftSessions++
    b.liftVolume += volume
    b.liftPRs += prs
    liftFirst = liftFirst && liftFirst < s.month ? liftFirst : s.month
    liftLast = liftLast && liftLast > s.month ? liftLast : s.month
  }
}

// ---- Apple Health stream (workouts + steps) ----
const STRENGTH = new Set([
  'FunctionalStrengthTraining',
  'TraditionalStrengthTraining',
])
const CAT_MAP = {
  Walking: 'Walking',
  Hiking: 'Walking',
  Badminton: 'Badminton',
  Running: 'Running',
  Cycling: 'Cycling',
  HighIntensityIntervalTraining: 'HIIT',
}
const categoryOf = (type) => {
  const k = type.replace('HKWorkoutActivityType', '')
  if (STRENGTH.has(k)) return null
  return CAT_MAP[k] || 'Other'
}

const stepsBySource = new Map() // source -> Map(month->steps)
const sourceTotals = new Map()
let workoutCount = 0

const exportXml = resolve(rawDir, 'apple_health_export/export.xml')
if (existsSync(exportXml)) {
  const rl = createInterface({
    input: createReadStream(exportXml),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (line.includes('HKWorkoutActivityType')) {
      const type = line.match(/workoutActivityType="([^"]+)"/)?.[1]
      const start = line.match(/startDate="([^"]+)"/)?.[1]
      if (!type || !start) continue
      const month = start.slice(0, 7)
      if (!inWindow(month)) continue
      const cat = categoryOf(type)
      if (!cat) continue
      monthly.get(month).workouts[cat]++
      workoutCount++
    } else if (line.includes('HKQuantityTypeIdentifierStepCount')) {
      const start = line.match(/startDate="([^"]+)"/)?.[1]
      const value = Number(line.match(/ value="([^"]+)"/)?.[1])
      const source = line.match(/sourceName="([^"]+)"/)?.[1] ?? 'unknown'
      if (!start || !Number.isFinite(value)) continue
      const month = start.slice(0, 7)
      if (!inWindow(month)) continue
      if (!stepsBySource.has(source)) stepsBySource.set(source, new Map())
      const sm = stepsBySource.get(source)
      sm.set(month, (sm.get(month) || 0) + value)
      sourceTotals.set(source, (sourceTotals.get(source) || 0) + value)
    }
  }
}

// Steps: use the single dominant source to avoid iPhone/Watch double-counting.
let stepsSource = null
let best = -1
for (const [src, total] of sourceTotals) {
  if (total > best) {
    best = total
    stepsSource = src
  }
}
if (stepsSource) {
  const sm = stepsBySource.get(stepsSource)
  for (const k of monthKeys) monthly.get(k).steps = Math.round(sm.get(k) || 0)
}

const monthlyOut = monthKeys.map((k) => ({ month: k, ...monthly.get(k) }))
const sumWorkouts = () =>
  CATEGORIES.reduce((s, c) => s + monthlyOut.reduce((a, m) => a + m.workouts[c], 0), 0)

const data = {
  note: 'Lifting from reptracker CSVs; non-strength workouts + steps from Apple Health (strength excluded to avoid double-counting). Steps use a single dominant source.',
  window: { from: `${monthKeys[0]}-01`, to: `${monthKeys[11]}-31` },
  workoutCategories: CATEGORIES,
  monthly: monthlyOut,
  liftingCoverage: {
    first: liftFirst,
    last: liftLast,
    note: 'reptracker DB paused after Jul 2025, so logged lifting within the window covers only these months. Later months are genuinely empty, not zero-effort.',
  },
  stepsSource,
  totals: {
    liftSessions: monthlyOut.reduce((s, m) => s + m.liftSessions, 0),
    liftVolume: monthlyOut.reduce((s, m) => s + m.liftVolume, 0),
    liftPRs: monthlyOut.reduce((s, m) => s + m.liftPRs, 0),
    steps: monthlyOut.reduce((s, m) => s + m.steps, 0),
    workouts: sumWorkouts(),
  },
}

await mkdir(resolve(root, 'data'), { recursive: true })
const out = resolve(root, 'data/training.json')
await writeFile(out, JSON.stringify(data, null, 2) + '\n')
console.log(`Wrote ${out}`)
console.log(
  `  lift: ${data.totals.liftSessions} sessions (${liftFirst}..${liftLast}), ` +
    `${(data.totals.liftVolume / 1000).toFixed(0)}k volume, ${data.totals.liftPRs} PRs · ` +
    `AH workouts: ${workoutCount} · steps source: ${stepsSource} (${(data.totals.steps / 1e6).toFixed(2)}M)`,
)
