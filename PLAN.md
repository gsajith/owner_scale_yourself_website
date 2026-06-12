# Scale Yourself — Report Plan

A data-driven "Year in Review" report for Owner's take-home ("Scale Yourself"). Summarizes professional + personal habits and growth over the past year, presented as an editorial scrollytelling website (+ PDF), submitted as a zip.

**Window:** Jun 2025 → May 2026 (12 complete months, all charts aligned).

---

## Thesis & framing

- **Core story:** AI force-multiplier. Between roles since **April 2025**, treated as a deliberate self-investment sprint — went deep on AI-agent workflows, shipped personal projects, rebuilt health and habits.
- **Framing:** name the gap **once, up front, matter-of-factly**, then let the data lead. No dwelling.
- **Two pillars:**
  - **Craft** — personal projects (GitHub), agent usage (Claude), self-built tooling (skills/MCPs).
  - **Personal growth** — fitness/body, sleep, reading, film.
- **"What it's like to work with me"** answered via how I self-direct and collaborate *with AI agents*.

---

## Data sources

All sources are personally owned — no employer/confidential data (satisfies the "no sensitive info" rule).

| Source | Pulls | Extraction | Owner |
|---|---|---|---|
| GitHub (`gsajith`, personal) | public repos in detail; private as counts-only/month | `gh` / GraphQL `contributionsCollection` | **Me** |
| Claude transcripts (`~/.claude`) | sessions, tokens, tools/MCPs, **skills built**, project breadth | metadata-only, curated project labels | **Me** |
| Apple Health | weight/BMI/body-fat/lean mass, activity/steps, **sleep**, workout types (cardio/badminton/walking) | `export.zip` → parse `export.xml` | **You — [#1](../../issues/1)** |
| Supabase workout app (recovered) | lifting: frequency, volume, PRs | recovered from paused-project dump → `data/raw/reptracker_*.csv` | **Done — [#4](../../issues/4)** ✅ |
| StoryGraph | books finished, dates, ratings, pages | CSV export | **You — [#2](../../issues/2)** |
| Letterboxd | films watched, dates, ratings, favorites | export ZIP (`diary/watched/ratings.csv`) | **You — [#3](../../issues/3)** |

**Privacy rules**
- Claude: metadata-only; topics inferred from project/repo names, not message bodies; curated whitelist of project names, rest bucketed.
- GitHub private/work: aggregate counts only — no names, code, or messages.
- Body metrics: **deltas + normalized trends**, no vanity absolutes.
- Secrets: Supabase creds in untracked `.env`, never committed.

---

## Presentation

- **Stack:** Vite + React + TypeScript + **CSS Modules** (no Tailwind/shadcn).
- **Charts:** **visx / D3 + custom annotation layer** (point-anchored callouts + poster timelines — beyond Recharts).
- **Paradigm:** **editorial scrollytelling** — charts draw in, annotations fly to data points — that **settles to a fully-composed print-clean static state** (so the PDF stays crisp).
- **Hero:** commit-surge chart with annotated **AI-adoption inflection** + a combined month-by-month overview up top.
- **Reading & film:** poster/cover art **fetched (TMDB / OpenLibrary) and vendored locally**; favorites featured large w/ blurbs, long tail as a poster wall.
- **Curation:** data-assisted, **you approve** callouts, favorite picks, blurbs ([#6](../../issues/6)).
- **Design:** editorial annual-report aesthetic + a subtle accent from owner.com's real palette; light/print-friendly, optional dark hero.
- **Voice:** candid, confident, lightly witty; name + short framing intro + small portrait ([#5](../../issues/5)).

---

## Deliverables (in the zip)

1. Static-built site (`dist/`) — opens offline.
2. **Playwright-rendered PDF** of the built site (single source of truth).
3. In-app **"Export to PDF"** button (`window.print()` + `@media print` stylesheet).

---

## Sequence

**Collect all data first, then build** (chosen approach).

### Phase 0 — Data gathering (YOU — blocks the build)
- [ ] [#1](../../issues/1) Apple Health export → `data/raw/`
- [ ] [#2](../../issues/2) StoryGraph CSV → `data/raw/`
- [ ] [#3](../../issues/3) Letterboxd ZIP → `data/raw/`
- [x] [#4](../../issues/4) Workout data — ✅ recovered from paused-Supabase dump (`data/raw/reptracker_*.csv`). ⚠️ lifting only covers **Jun & Jul 2025** within the window; Aug 2025+ empty (DB was paused). Backend migration to Neon deferred.
- [ ] [#5](../../issues/5) Portrait photo + framing intro line

### Phase 1 — Extraction (ME)
- [ ] GitHub miner (`gh`/GraphQL) → monthly commit/PR/repo stats
- [ ] Claude transcript miner → sessions/tokens/tools/skills/projects per month
- [ ] Self-built skills/MCPs timeline
- [ ] Apple Health parser (weight/body/activity/sleep/workout-types)
- [ ] Supabase aggregator → `data/workouts.json`
- [ ] StoryGraph + Letterboxd parsers; poster/cover fetch + vendor

### Phase 2 — Build (ME)
- [ ] Scaffold Vite + React + TS + CSS Modules
- [ ] Data schema + `data/*.json` per section
- [ ] visx/D3 chart components + annotation layer
- [ ] Scrollytelling sections (craft + personal); hero inflection chart; month-by-month overview
- [ ] Reading + film timelines with vendored art
- [ ] Print stylesheet + editorial design pass (owner.com accent)

### Phase 3 — Curate & ship (BOTH)
- [ ] [#6](../../issues/6) Approve callouts, favorites, blurbs
- [ ] Playwright PDF render
- [ ] Final design polish
- [ ] Zip the deliverable

---

## Issue index
- [#1](../../issues/1) Apple Health export
- [#2](../../issues/2) StoryGraph export
- [#3](../../issues/3) Letterboxd export
- [#4](../../issues/4) Supabase read-only credentials
- [#5](../../issues/5) Portrait photo + framing intro line
- [#6](../../issues/6) Approve curation (later gate)
