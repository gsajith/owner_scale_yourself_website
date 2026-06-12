// Renders the built static site (dist/) to report.pdf via Playwright, using print
// media so the @media print rules and the scrollytelling resting state apply.
// Serves dist/ over a throwaway local HTTP server (SPA fallback to index.html).
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const distDir = resolve(root, 'dist')
const outPdf = resolve(root, 'report.pdf')

if (!existsSync(distDir)) {
  console.error('dist/ not found — run `npm run build` first.')
  process.exit(1)
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
}

const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent((req.url || '/').split('?')[0])
    if (pathname === '/') pathname = '/index.html'
    let file = join(distDir, pathname)
    if (!file.startsWith(distDir)) {
      res.writeHead(403)
      return res.end()
    }
    if (!existsSync(file) || (await stat(file)).isDirectory()) {
      file = join(distDir, 'index.html')
    }
    const body = await readFile(file)
    res.writeHead(200, {
      'content-type': MIME[extname(file)] || 'application/octet-stream',
    })
    res.end(body)
  } catch (err) {
    res.writeHead(500)
    res.end(String(err))
  }
})

await new Promise((r) => server.listen(0, r))
const { port } = server.address()

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
  await page.emulateMedia({ media: 'print' })
  await page.pdf({
    path: outPdf,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  })
  console.log(`Wrote ${outPdf}`)
} finally {
  await browser.close()
  server.close()
}
