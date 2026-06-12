// Prepares published media assets from the raw (gitignored) exports.
// For #7: the portrait — strip EXIF (the original carries GPS + device metadata)
// and downscale, writing the committed public/portrait.jpg. Later issues extend
// this script for cover/poster art.
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

// data/raw is gitignored and lives only in the main checkout, so when running
// from a worktree we fall back to the main checkout's copy.
function findRawDir() {
  const candidates = [
    process.env.RAW_DATA_DIR,
    resolve(root, 'data/raw'),
    resolve(root, '../../../data/raw'),
  ].filter(Boolean)
  return candidates.find((dir) => existsSync(resolve(dir, 'propic.jpg'))) ?? null
}

const rawDir = findRawDir()
if (!rawDir) {
  console.error(
    'Could not locate data/raw/propic.jpg. Set RAW_DATA_DIR to the folder containing it.',
  )
  process.exit(1)
}

const outDir = resolve(root, 'public')
await mkdir(outDir, { recursive: true })
const out = resolve(outDir, 'portrait.jpg')

await sharp(resolve(rawDir, 'propic.jpg'))
  .rotate() // bake in EXIF orientation before metadata is dropped
  .resize({ width: 720 }) // downscale, preserve aspect
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(out) // sharp drops all metadata (incl. GPS) unless withMetadata() is called

console.log(`Wrote ${out} — EXIF stripped, downscaled to 720px wide.`)
