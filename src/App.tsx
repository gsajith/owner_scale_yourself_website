import IntroHero from './sections/IntroHero/IntroHero'
import GitHub from './sections/GitHub/GitHub'

// The report is a single vertically-scrolled page. Each section is a self-contained
// module that plugs in here; later issues (#9–#16) append their sections below.
export default function App() {
  return (
    <main>
      <IntroHero />
      <GitHub />
      {/* sections added by #9–#16 */}
    </main>
  )
}
