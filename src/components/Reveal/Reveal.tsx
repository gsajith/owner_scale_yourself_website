import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './Reveal.module.css'

interface RevealProps {
  children: ReactNode
  className?: string
}

/**
 * Scroll-reveal wrapper. Content animates in when it enters the viewport, but the
 * RESTING state is fully composed (visible) — print media and reduced-motion users
 * skip the animation entirely, so the Playwright PDF and no-motion renders show
 * everything. This is the print-clean guarantee the whole report relies on.
 */
export default function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const classes = [styles.reveal, inView ? styles.inView : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  )
}
