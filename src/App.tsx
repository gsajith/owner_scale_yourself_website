import IntroHero from './sections/IntroHero/IntroHero'
import Overview from './sections/Overview/Overview'
import GitHub from './sections/GitHub/GitHub'
import Agent from './sections/Agent/Agent'
import Training from './sections/Training/Training'
import Body from './sections/Body/Body'
import Reading from './sections/Reading/Reading'
import Film from './sections/Film/Film'

// The report is a single vertically-scrolled page. Each section is a self-contained
// module that plugs in here; #15–#16 handle design polish and packaging.
export default function App() {
  return (
    <main>
      <IntroHero />
      <Overview />
      <GitHub />
      <Agent />
      <Training />
      <Body />
      <Reading />
      <Film />
    </main>
  )
}
