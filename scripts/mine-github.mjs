// Mines GitHub activity for the report window via `gh api graphql` (auth handled
// by gh — no token is read or committed). Runs as `viewer` (= gsajith), so private
// contributions surface as restricted counts. Writes aggregated data/github.json.
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

function gql(query, variables = {}) {
  const args = ['api', 'graphql', '-f', `query=${query}`]
  for (const [k, v] of Object.entries(variables)) args.push('-f', `${k}=${v}`)
  const out = execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  const json = JSON.parse(out)
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2))
  return json.data
}

// Window: June 2025 .. May 2026 inclusive (12 months).
const months = []
for (let i = 0; i < 12; i++) {
  const monthIdx = 5 + i // 5 = June (0-indexed)
  const y = 2025 + Math.floor(monthIdx / 12)
  const m = monthIdx % 12
  const start = new Date(Date.UTC(y, m, 1))
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59))
  months.push({
    key: `${y}-${String(m + 1).padStart(2, '0')}`,
    from: start.toISOString(),
    to: end.toISOString(),
  })
}

const CONTRIB = `query($from:DateTime!,$to:DateTime!){viewer{contributionsCollection(from:$from,to:$to){totalCommitContributions totalPullRequestContributions totalPullRequestReviewContributions totalIssueContributions restrictedContributionsCount contributionCalendar{totalContributions}}}}`

console.log('Mining monthly contributions…')
const monthly = months.map((mo) => {
  const c = gql(CONTRIB, { from: mo.from, to: mo.to }).viewer
    .contributionsCollection
  return {
    month: mo.key,
    commits: c.totalCommitContributions,
    pullRequests: c.totalPullRequestContributions,
    reviews: c.totalPullRequestReviewContributions,
    issues: c.totalIssueContributions,
    privateContributions: c.restrictedContributionsCount,
    totalContributions: c.contributionCalendar.totalContributions,
  }
})

// Repos owned by viewer (paginate). Languages + repos created in window.
const REPOS = `query($cursor:String){viewer{repositories(first:100,after:$cursor,ownerAffiliations:OWNER,isFork:false,orderBy:{field:CREATED_AT,direction:DESC}){pageInfo{hasNextPage endCursor} nodes{name createdAt isPrivate stargazerCount primaryLanguage{name}}}}}`

console.log('Mining repositories…')
let cursor = null
const repos = []
do {
  const page = gql(REPOS, ...(cursor ? [{ cursor }] : [])).viewer.repositories
  repos.push(...page.nodes)
  cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null
} while (cursor)

const windowStart = Date.parse(months[0].from)
const windowEnd = Date.parse(months[11].to)
const inWindow = (iso) => {
  const t = Date.parse(iso)
  return t >= windowStart && t <= windowEnd
}

const publicRepos = repos.filter((r) => !r.isPrivate)
const publicCreatedInWindow = publicRepos
  .filter((r) => inWindow(r.createdAt))
  .map((r) => ({
    name: r.name,
    createdAt: r.createdAt,
    language: r.primaryLanguage?.name ?? null,
    stars: r.stargazerCount,
  }))
const privateCreatedInWindowCount = repos.filter(
  (r) => r.isPrivate && inWindow(r.createdAt),
).length

// Language footprint across all public non-fork repos (counts only).
const langCounts = {}
for (const r of publicRepos) {
  const lang = r.primaryLanguage?.name
  if (lang) langCounts[lang] = (langCounts[lang] ?? 0) + 1
}
const languages = Object.entries(langCounts)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)

// Inflection = largest month-over-month jump in TOTAL contributions (the charted
// metric — captures the private-contribution surge, not just public commits).
let inflectionMonth = monthly[0].month
let maxJump = -Infinity
for (let i = 1; i < monthly.length; i++) {
  const jump = monthly[i].totalContributions - monthly[i - 1].totalContributions
  if (jump > maxJump) {
    maxJump = jump
    inflectionMonth = monthly[i].month
  }
}

const data = {
  account: 'gsajith',
  window: { from: months[0].from, to: months[11].to },
  note: 'Aggregated via scripts/mine-github.mjs (gh GraphQL, viewer). No credentials stored. Private activity is counts-only.',
  monthly,
  inflection: {
    month: inflectionMonth,
    defaultLabel: 'AI-agent adoption',
    note: 'Auto-detected as the largest month-over-month jump in total contributions; wording finalized in #6 (curation).',
  },
  publicReposCreatedInWindow: publicCreatedInWindow,
  privateReposCreatedInWindowCount: privateCreatedInWindowCount,
  totalPublicRepos: publicRepos.length,
  languages,
}

mkdirSync(resolve(root, 'data'), { recursive: true })
const out = resolve(root, 'data/github.json')
writeFileSync(out, JSON.stringify(data, null, 2) + '\n')
console.log(`Wrote ${out}`)
console.log(
  `  ${monthly.length} months, inflection ${inflectionMonth}, ` +
    `${publicCreatedInWindow.length} public repos created in window, ` +
    `${languages.length} languages.`,
)
