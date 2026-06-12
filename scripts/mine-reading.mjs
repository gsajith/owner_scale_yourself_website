// Parses the StoryGraph export for books finished in the window, fetches cover art
// from OpenLibrary (by ISBN, falling back to title/author search), downscales and
// vendors the images under public/covers/, and writes data/reading.json.
import { existsSync, readFileSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

function findRaw() {
  for (const c of [
    process.env.RAW_DATA_DIR,
    resolve(root, 'data/raw'),
    resolve(root, '../../../data/raw'),
  ]) {
    if (c && existsSync(resolve(c, 'storygraph_export.csv')))
      return resolve(c, 'storygraph_export.csv')
  }
  return null
}
const csvPath = findRaw()
if (!csvPath) {
  console.error('Could not locate storygraph_export.csv')
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

const lines = readFileSync(csvPath, 'utf8').split('\n').filter(Boolean)
const header = parseCsvLine(lines[0])
const col = (name) => header.indexOf(name)
const C = {
  title: col('Title'),
  authors: col('Authors'),
  isbn: col('ISBN/UID'),
  status: col('Read Status'),
  lastRead: col('Last Date Read'),
  rating: col('Star Rating'),
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)

const mkBook = (cells, extra) => ({
  title: cells[C.title],
  author: cells[C.authors],
  isbn: (cells[C.isbn] || '').replace(/[^0-9Xx]/g, ''),
  rating: cells[C.rating] ? Number(cells[C.rating]) : null,
  ...extra,
})

const books = [] // finished in window
const current = [] // currently reading
for (const line of lines.slice(1)) {
  const cells = parseCsvLine(line)
  const status = cells[C.status]
  if (status === 'read') {
    const last = cells[C.lastRead] // YYYY/MM/DD
    if (!last) continue
    const month = `${last.slice(0, 4)}-${last.slice(5, 7)}`
    if (!inWindow(month)) continue
    books.push(mkBook(cells, { dateRead: last.replace(/\//g, '-'), month }))
  } else if (status === 'currently-reading') {
    current.push(mkBook(cells, {}))
  }
}
books.sort((a, b) => a.dateRead.localeCompare(b.dateRead))

// ---- cover fetching ----
const coversDir = resolve(root, 'public/covers')
await mkdir(coversDir, { recursive: true })

async function fetchBuffer(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.length > 800 ? buf : null // OpenLibrary returns a tiny blank for misses
  } catch {
    return null
  }
}

async function findCover(book) {
  // 1) by ISBN
  if (book.isbn) {
    const buf = await fetchBuffer(
      `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false`,
    )
    if (buf) return buf
  }
  // 2) search by title + author
  try {
    const q = encodeURIComponent(`${book.title} ${book.author}`)
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i`,
    )
    if (res.ok) {
      const json = await res.json()
      const coverId = json.docs?.[0]?.cover_i
      if (coverId) {
        const buf = await fetchBuffer(
          `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`,
        )
        if (buf) return buf
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

let fetched = 0
async function attachCover(book) {
  const slug = slugify(book.title)
  const outFile = resolve(coversDir, `${slug}.jpg`)
  if (existsSync(outFile)) {
    book.cover = `covers/${slug}.jpg`
    return
  }
  const buf = await findCover(book)
  if (buf) {
    await sharp(buf).resize({ width: 240 }).jpeg({ quality: 80 }).toFile(outFile)
    book.cover = `covers/${slug}.jpg`
    fetched++
  } else {
    book.cover = null
  }
}
for (const book of [...books, ...current]) await attachCover(book)

const monthly = monthKeys.map((k) => ({
  month: k,
  label: shortMonth(k),
  count: books.filter((b) => b.month === k).length,
}))
const rated = books.filter((b) => b.rating != null)
const data = {
  note: 'From StoryGraph export. Covers fetched from OpenLibrary and vendored under public/covers/.',
  window: { from: `${monthKeys[0]}-01`, to: `${monthKeys[11]}-31` },
  monthly,
  books: books.map((b) => ({
    title: b.title,
    author: b.author,
    rating: b.rating,
    month: b.month,
    monthLabel: shortMonth(b.month),
    dateRead: b.dateRead,
    cover: b.cover,
  })),
  currentlyReading: current.map((b) => ({
    title: b.title,
    author: b.author,
    rating: b.rating,
    cover: b.cover,
  })),
  totals: {
    books: books.length,
    currentlyReading: current.length,
    withCover: [...books, ...current].filter((b) => b.cover).length,
    avgRating: rated.length
      ? rated.reduce((s, b) => s + b.rating, 0) / rated.length
      : null,
  },
}

await mkdir(resolve(root, 'data'), { recursive: true })
const out = resolve(root, 'data/reading.json')
await writeFile(out, JSON.stringify(data, null, 2) + '\n')
console.log(`Wrote ${out}`)
console.log(
  `  ${data.totals.books} books (${data.totals.withCover} with covers, ${fetched} newly fetched), ` +
    `avg rating ${data.totals.avgRating?.toFixed(2)}`,
)
