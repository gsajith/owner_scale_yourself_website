import Section from '../../components/Section/Section'
import Reveal from '../../components/Reveal/Reveal'
import CoverCard from '../../components/CoverCard/CoverCard'
import readingData from '../../../data/reading.json'
import styles from './Reading.module.css'

interface Book {
  title: string
  author: string
  rating: number | null
  monthLabel?: string
  cover: string | null
}
interface ReadingData {
  books: Book[]
  currentlyReading: Book[]
  totals: {
    books: number
    currentlyReading: number
    avgRating: number | null
  }
}
const data = readingData as ReadingData

export default function Reading() {
  return (
    <Section id="reading" eyebrow="Personal · Reading" title="Reading">
      <Reveal>
        <p className={styles.lede}>
          A deliberate reading year rather than a voracious one — one book finished
          inside the window and three more in flight, ranging from cyberpunk to
          people's history to sustainability. I read slowly and finish what earns it.
        </p>
      </Reveal>
      <Reveal>
        <ul className={styles.stats}>
          <li>
            <strong>{data.totals.books}</strong>
            <span>finished in window</span>
          </li>
          <li>
            <strong>{data.totals.currentlyReading}</strong>
            <span>currently reading</span>
          </li>
          <li>
            <strong>
              {data.totals.avgRating != null
                ? `${data.totals.avgRating.toFixed(1)}★`
                : '—'}
            </strong>
            <span>avg rating</span>
          </li>
        </ul>
      </Reveal>
      {data.books.length > 0 && (
        <Reveal>
          <h3 className={styles.h3}>Finished this year</h3>
          <div className={styles.shelf}>
            {data.books.map((b) => (
              <CoverCard
                key={b.title}
                cover={b.cover}
                title={b.title}
                subtitle={b.author}
                rating={b.rating}
                size="lg"
              />
            ))}
          </div>
        </Reveal>
      )}
      {data.currentlyReading.length > 0 && (
        <Reveal>
          <h3 className={styles.h3}>Currently reading</h3>
          <div className={styles.shelf}>
            {data.currentlyReading.map((b) => (
              <CoverCard
                key={b.title}
                cover={b.cover}
                title={b.title}
                subtitle={b.author}
              />
            ))}
          </div>
        </Reveal>
      )}
    </Section>
  )
}
