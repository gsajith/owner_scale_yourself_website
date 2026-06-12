import IntroHero from './sections/IntroHero/IntroHero'
import GitHub from './sections/GitHub/GitHub'
import Agent from './sections/Agent/Agent'
import Training from './sections/Training/Training'
import Body from './sections/Body/Body'

// The report is a single vertically-scrolled page. Each section is a self-contained
// module that plugs in here; later issues (#12–#16) append their sections below.
export default function App() {
  return (
    <main>
      <IntroHero />
      <GitHub />
      <Agent />
      <Training />
      <Body />
      {/* sections added by #12–#16 */}
    </main>
  )
}
