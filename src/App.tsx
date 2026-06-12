import IntroHero from './sections/IntroHero/IntroHero'

// The report is a single vertically-scrolled page. Each section is a self-contained
// module that plugs in here; later issues (#8–#16) append their sections below.
export default function App() {
  return (
    <main>
      <IntroHero />
      {/* sections added by #8–#16 */}
    </main>
  )
}
