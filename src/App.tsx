import IntroHero from './sections/IntroHero/IntroHero'
import GitHub from './sections/GitHub/GitHub'
import Agent from './sections/Agent/Agent'
import Training from './sections/Training/Training'
import Body from './sections/Body/Body'
import Reading from './sections/Reading/Reading'

// The report is a single vertically-scrolled page. Each section is a self-contained
// module that plugs in here; later issues (#13–#16) append their sections below.
export default function App() {
  return (
    <main>
      <IntroHero />
      <GitHub />
      <Agent />
      <Training />
      <Body />
      <Reading />
      {/* sections added by #13–#16 */}
    </main>
  )
}
