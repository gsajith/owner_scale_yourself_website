# Year in Review — *Scale Yourself*

An editorial, data-driven report on a year of building, learning, and personal growth — **Jun 2025 → May 2026**. Rendered as a scrollytelling website with annotated charts, and exportable to PDF.

> **Status:** 🚧 In active development. The full plan lives in [`PLAN.md`](./PLAN.md); tasks are tracked in [issues](../../issues).

---

## What this is

A "Year in Review" that tells one story two ways:

- **Craft** — personal projects, AI-agent adoption, and self-built tooling (custom skills/MCPs).
- **Personal growth** — fitness & body recomposition, sleep, reading, and film.

Charts call out inflection points (e.g. an AI-adoption commit surge), the reading and film sections render as timelines with cover/poster art, and the whole thing settles to a print-clean state for a faithful PDF.

## Stack

- **Vite + React + TypeScript + CSS Modules**
- **visx / D3** for charts + a custom annotation layer
- Scroll-driven reveals (intersection observer) with a static resting state
- **Playwright** to render the built site to PDF; in-app "Export to PDF" via a `@media print` stylesheet

## Data sources

All data is personally owned — no employer or confidential data is included.

| Pillar | Source | Signals |
|---|---|---|
| Craft | GitHub (`gsajith`) | repos, commits, PRs, languages |
| Craft | Claude/agent usage | sessions, tokens, tools/MCPs, skills built, project breadth |
| Personal | Apple Health | weight/body composition, activity, sleep, workout types |
| Personal | Supabase workout app | lifting frequency, volume, PRs |
| Personal | StoryGraph | books read, ratings |
| Personal | Letterboxd | films watched, ratings, favorites |

**Privacy**
- Agent data is mined as **metadata only** (counts/tokens/tool names) — message contents are not read into the report.
- Body metrics are shown as **deltas and normalized trends**, not absolute vanity numbers.
- Raw exports live under `data/raw/` (gitignored); secrets live in an untracked `.env`. Only aggregated, summarized data is committed.

## Project structure

```
.
├── PLAN.md              # canonical plan + phased sequence
├── data/
│   ├── raw/             # exports drop here (gitignored)
│   └── *.json           # aggregated, committed data per section
├── scripts/             # extraction + aggregation scripts
├── src/                 # Vite + React app
└── public/              # vendored cover/poster art, portrait
```

## Getting started

> Scaffolding lands once data collection (issues [#1–#5](../../issues)) is complete.

```bash
npm install
npm run dev        # local dev server
npm run build      # static build → dist/
npm run pdf        # render dist/ to PDF via Playwright
```

## License

Personal project — all rights reserved unless noted otherwise.
