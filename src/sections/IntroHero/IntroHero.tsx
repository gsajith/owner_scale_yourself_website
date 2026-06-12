import Reveal from '../../components/Reveal/Reveal'
import { intro } from '../../content/intro'
import styles from './IntroHero.module.css'

export default function IntroHero() {
  return (
    <section className={styles.hero} id="intro">
      <div className={styles.inner}>
        <Reveal className={styles.portraitWrap}>
          <img
            className={styles.portrait}
            src={intro.portraitSrc}
            alt={intro.portraitAlt}
            width={720}
            height={857}
          />
        </Reveal>
        <div className={styles.copy}>
          <Reveal>
            <p className={styles.eyebrow}>
              {intro.reportTitle} · {intro.windowLabel}
            </p>
            <h1 className={styles.name}>{intro.name}</h1>
          </Reveal>
          {intro.paragraphs.map((paragraph, i) => (
            <Reveal key={i}>
              <p className={styles.lede}>{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
