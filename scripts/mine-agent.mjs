// Mines local Claude Code usage from ~/.claude/projects transcripts — METADATA ONLY.
// Never reads or stores message text: only timestamps, session ids, token usage
// counts, tool/MCP/skill *names*, and project folder names. Writes data/agent.json.
//
// Note on horizon: the local transcript history only begins in mid-2026, so this is a
// snapshot of the recent agent-adoption period, not a full 12-month trend. The actual
// covered months are exposed as `dataHorizon` and `monthly` so the section can be
// honest about it. The report's own project is excluded so the data isn't self-referential.
import { createReadStream } from 'node:fs'
import { readdir, writeFile, mkdir } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const PROJECTS_DIR = join(homedir(), '.claude', 'projects')

const EXCLUDE_PROJECT = 'owner_scale_yourself_website'
const monthOf = (iso) => (iso ? iso.slice(0, 7) : null)

function projectLabel(cwd) {
  if (!cwd) return null
  // Strip worktree suffixes, then resolve to the project root under /Projects/<name>
  // so subdirectories (dist, src, extension, …) don't register as separate projects.
  const noWorktree = cwd.replace(/\/\.claude\/worktrees\/.*$/, '')
  const match = noWorktree.match(/\/Projects\/([^/]+)/)
  return match ? match[1] : basename(noWorktree)
}

const monthly = new Map() // month -> aggregates
const ensureMonth = (k) => {
  if (!monthly.has(k))
    monthly.set(k, {
      sessions: new Set(),
      tokens: 0,
      toolCalls: 0,
      mcpCalls: 0,
      projects: new Set(),
    })
  return monthly.get(k)
}

const toolFirstSeen = new Map()
const skillCounts = new Map()
const mcpServerCounts = new Map()
const projectSessions = new Map()
const allTools = new Set()
const allSessions = new Set()

const noteFirstSeen = (name, month) => {
  const prev = toolFirstSeen.get(name)
  if (!prev || month < prev) toolFirstSeen.set(name, month)
}

async function processFile(file) {
  const rl = createInterface({
    input: createReadStream(file),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line) continue
    let o
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    const month = monthOf(o.timestamp)
    if (!month) continue
    const proj = projectLabel(o.cwd)
    // Skip the report's own project (incl. worktrees) and the bare ~/Projects parent.
    if (proj === EXCLUDE_PROJECT || proj === 'Projects') continue

    const bucket = ensureMonth(month)
    if (o.sessionId) {
      bucket.sessions.add(o.sessionId)
      allSessions.add(o.sessionId)
    }
    if (proj) {
      bucket.projects.add(proj)
      if (!projectSessions.has(proj)) projectSessions.set(proj, new Set())
      if (o.sessionId) projectSessions.get(proj).add(o.sessionId)
    }

    const msg = o.message
    if (msg?.usage) {
      bucket.tokens +=
        (msg.usage.input_tokens || 0) + (msg.usage.output_tokens || 0)
    }
    if (Array.isArray(msg?.content)) {
      for (const c of msg.content) {
        if (c?.type !== 'tool_use' || !c.name) continue
        bucket.toolCalls += 1
        allTools.add(c.name)
        if (c.name.startsWith('mcp__')) {
          bucket.mcpCalls += 1
          const server = c.name.split('__')[1] ?? c.name
          mcpServerCounts.set(server, (mcpServerCounts.get(server) || 0) + 1)
          noteFirstSeen(`mcp:${server}`, month)
        } else if (c.name === 'Skill') {
          const skill = c.input?.skill ?? c.input?.command
          if (skill) {
            skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)
            noteFirstSeen(`skill:${skill}`, month)
          }
        }
      }
    }
  }
}

const dirs = await readdir(PROJECTS_DIR, { withFileTypes: true })
let fileCount = 0
for (const d of dirs) {
  if (!d.isDirectory()) continue
  let files
  try {
    files = await readdir(join(PROJECTS_DIR, d.name))
  } catch {
    continue
  }
  for (const f of files) {
    if (!f.endsWith('.jsonl')) continue
    fileCount += 1
    await processFile(join(PROJECTS_DIR, d.name, f))
  }
}

const presentMonths = [...monthly.keys()].sort()
const monthlyOut = presentMonths.map((k) => {
  const b = monthly.get(k)
  return {
    month: k,
    sessions: b.sessions.size,
    tokens: b.tokens,
    toolCalls: b.toolCalls,
    mcpCalls: b.mcpCalls,
    projects: b.projects.size,
  }
})

// Cumulative distinct skills + MCP servers first-seen, by present month.
const cumulativeToolkit = presentMonths.map((k) => ({
  month: k,
  count: [...toolFirstSeen.values()].filter((m) => m <= k).length,
}))

const topProjects = [...projectSessions.entries()]
  .map(([label, s]) => ({ label, sessions: s.size }))
  .sort((a, b) => b.sessions - a.sessions)
const TOP_N = 12
const sortDesc = (map) =>
  [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

const data = {
  generatedNote:
    'Mined from ~/.claude transcripts, metadata-only (timestamps, token counts, tool/MCP/skill names, project names). No message contents read or stored. The report project itself is excluded.',
  dataHorizon: {
    first: presentMonths[0] ?? null,
    last: presentMonths[presentMonths.length - 1] ?? null,
    note: 'Local Claude Code transcript history begins here — this is a snapshot of the recent agent-adoption period, not a full-year trend.',
  },
  monthly: monthlyOut,
  cumulativeToolkit,
  totals: {
    sessions: allSessions.size,
    tokens: monthlyOut.reduce((s, m) => s + m.tokens, 0),
    toolCalls: monthlyOut.reduce((s, m) => s + m.toolCalls, 0),
    distinctTools: allTools.size,
    distinctMcpServers: mcpServerCounts.size,
    distinctSkills: skillCounts.size,
    distinctProjects: projectSessions.size,
  },
  topProjects: topProjects.slice(0, TOP_N),
  otherProjectsCount: Math.max(0, topProjects.length - TOP_N),
  topSkills: sortDesc(skillCounts).slice(0, 10),
  topMcpServers: sortDesc(mcpServerCounts).slice(0, 10),
}

await mkdir(resolve(root, 'data'), { recursive: true })
const out = resolve(root, 'data/agent.json')
await writeFile(out, JSON.stringify(data, null, 2) + '\n')
console.log(`Wrote ${out}`)
console.log(
  `  ${fileCount} files · horizon ${data.dataHorizon.first}..${data.dataHorizon.last} · ` +
    `${data.totals.sessions} sessions · ${(data.totals.tokens / 1e6).toFixed(1)}M tokens · ` +
    `${data.totals.distinctSkills} skills · ${data.totals.distinctMcpServers} MCP servers · ` +
    `${data.totals.distinctProjects} projects`,
)
