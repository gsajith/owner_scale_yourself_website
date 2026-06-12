// Parses the Letterboxd diary for films watched in the window, fetches each film's
// portrait poster from Letterboxd's CDN (resolve boxd.it → film page → film-poster
// URL; no API key), downscales via sharp, and vendors under public/posters/.
// Writes data/film.json.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

function findDiary() {
  for (const base of [
    process.env.RAW_DATA_DIR,
    resolve(root, 'data/raw'),
    resolve(root, '../../../data/raw'),
  ]) {
    if (!base || !existsSync(base)) continue
    const dir = readdirSync(base).find((d) => d.startsWith('letterboxd-'))
    if (dir && existsSync(resolve(base, dir, 'diary.csv')))
      return resolve(base, dir, 'diary.csv')
  }
  return null
}
const diaryPath = findDiary()
if (!diaryPath) {
  console.error('Could not locate letterboxd-*/diary.csv')
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
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const shortMonth = (k) => MONTHS[Number(k.split('-')[1]) - 1] ?? k

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

// Letterboxd exports are CRLF — split on \r?\n so the last column isn't "...\r".
const lines = readFileSync(diaryPath, 'utf8').split(/\r?\n/).filter(Boolean)
const header = parseCsvLine(lines[0])
const idx = (n) => header.indexOf(n)
const COL = {
  date: idx('Date'),
  name: idx('Name'),
  year: idx('Year'),
  uri: idx('Letterboxd URI'),
  rating: idx('Rating'),
  watched: idx('Watched Date'),
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

const films = []
for (const line of lines.slice(1)) {
  const c = parseCsvLine(line)
  // Watched Date is optional and blank in this export → fall back to the diary Date.
  const watched = c[COL.watched] || c[COL.date]
  if (!watched) continue
  const month = watched.slice(0, 7)
  if (!inWindow(month)) continue
  films.push({
    title: c[COL.name],
    year: c[COL.year],
    uri: c[COL.uri],
    rating: c[COL.rating] ? Number(c[COL.rating]) : null,
    watchedDate: watched,
    month,
  })
}
films.sort((a, b) => a.watchedDate.localeCompare(b.watchedDate))

// ---- poster fetching (concurrency-limited, cached) ----
const postersDir = resolve(root, 'public/posters')
await mkdir(postersDir, { recursive: true })

async function fetchPoster(film) {
  const slug = slugify(`${film.title}-${film.year}`)
  const out = resolve(postersDir, `${slug}.jpg`)
  if (existsSync(out)) return `posters/${slug}.jpg`
  try {
    const page = await fetch(film.uri, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0' },
    })
    if (!page.ok) return null
    const html = await page.text()
    const m = html.match(
      /https:\/\/a\.ltrbxd\.com\/resized\/film-poster\/[^"]+\.jpg[^"]*/,
    )
    if (!m) return null
    const url = m[0].replace('-0-230-0-345-crop', '-0-460-0-690-crop')
    const img = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })
    if (!img.ok) return null
    const buf = Buffer.from(await img.arrayBuffer())
    if (buf.length < 800) return null
    await sharp(buf).resize({ width: 240 }).jpeg({ quality: 80 }).toFile(out)
    return `posters/${slug}.jpg`
  } catch {
    return null
  }
}

async function pool(items, n, fn) {
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      items[idx].poster = await fn(items[idx])
    }
  }
  await Promise.all(Array.from({ length: n }, worker))
}
await pool(films, 4, fetchPoster)

const monthly = monthKeys.map((k) => ({
  month: k,
  label: shortMonth(k),
  count: films.filter((f) => f.month === k).length,
}))
const rated = films.filter((f) => f.rating != null)
const favorites = films
  .filter((f) => f.rating != null && f.rating >= 4.5)
  .sort((a, b) => b.rating - a.rating || b.watchedDate.localeCompare(a.watchedDate))
  .slice(0, 12)

const trim = (f) => ({
  title: f.title,
  year: f.year,
  rating: f.rating,
  monthLabel: shortMonth(f.month),
  poster: f.poster,
})

const data = {
  note: 'From Letterboxd diary. Posters fetched from Letterboxd CDN and vendored under public/posters/. Favorites auto-selected (rating >= 4.5); finalized in #6.',
  window: { from: `${monthKeys[0]}-01`, to: `${monthKeys[11]}-31` },
  monthly,
  favorites: favorites.map(trim),
  films: films.map(trim),
  totals: {
    films: films.length,
    withPoster: films.filter((f) => f.poster).length,
    avgRating: rated.length
      ? rated.reduce((s, f) => s + f.rating, 0) / rated.length
      : null,
    favorites: favorites.length,
  },
}

await mkdir(resolve(root, 'data'), { recursive: true })
const out = resolve(root, 'data/film.json')
await writeFile(out, JSON.stringify(data, null, 2) + '\n')
console.log(`Wrote ${out}`)
console.log(
  `  ${data.totals.films} films (${data.totals.withPoster} with posters), ` +
    `avg ${data.totals.avgRating?.toFixed(2)}, ${data.totals.favorites} favorites`,
)
