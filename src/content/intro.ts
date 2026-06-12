export interface IntroContent {
  reportTitle: string
  name: string
  windowLabel: string
  paragraphs: string[]
  portraitSrc: string
  portraitAlt: string
}

// Approved copy — source of record is content/intro.md (issue #5).
export const intro: IntroContent = {
  reportTitle: 'Year in Review',
  name: 'Gautham Sajith',
  windowLabel: 'June 2025 – May 2026',
  paragraphs: [
    "I'm a full-stack software engineer and designer based in NYC, with over a decade of experience building scalable products, productivity tooling, and infrastructure for designers/developers at startups and large companies like Google and Spotify.",
    "I was laid off in April of 2025, and I've spent the year investing in myself full-time — going deep on AI-agent workflows, shipping independent projects, and rebuilding my health and habits.",
  ],
  // Relative to BASE_URL so it resolves under base: './' (offline + PDF safe).
  portraitSrc: `${import.meta.env.BASE_URL}portrait.jpg`,
  portraitAlt: 'Gautham Sajith',
}
