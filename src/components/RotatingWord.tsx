import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from 'motion/react'

const INTERVAL = 2000
const START_DELAY = 200

const letter: Variants = {
  hidden: { opacity: 0, scaleX: 1.9, skewX: -28, y: '0.1em', filter: 'blur(10px)' },
  visible: (i: number) => ({
    opacity: 1,
    scaleX: 1,
    skewX: 0,
    y: '0em',
    filter: 'blur(0px)',
    transition: { delay: 0.12 + i * 0.035, duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  }),
  exit: (i: number) => ({
    opacity: 0,
    scaleX: 0.4,
    skewX: 28,
    y: '-0.1em',
    filter: 'blur(10px)',
    transition: { delay: i * 0.02, duration: 0.4, ease: [0.7, 0, 0.84, 0] },
  }),
}

/** widths of each word from a hidden measuring row, re-read when the type size changes */
export function useWordWidths() {
  const ref = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState<number[]>([])
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setWidths([...el.children].map((c) => (c as HTMLElement).offsetWidth + 1))
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    document.fonts?.ready.then(read)
    return () => ro.disconnect()
  }, [])
  return [ref, widths] as const
}

type Props = {
  words: string[]
  widths: number[]
  /** the element whose visibility drives the rotation */
  scope: React.RefObject<HTMLElement | null>
  onChange?: (word: string) => void
}

export function RotatingWord({ words, widths, scope, onChange }: Props) {
  const [index, setIndex] = useState(0)
  const [swapped, setSwapped] = useState(false)
  const inView = useInView(scope, { amount: 0.3 })
  const reduced = useReducedMotion()
  const firstRun = useRef(true)

  useEffect(() => {
    if (!inView || reduced) return
    let timer: number
    const tick = () => {
      setSwapped(true)
      setIndex((i) => (i + 1) % words.length)
      timer = window.setTimeout(tick, INTERVAL)
    }
    timer = window.setTimeout(tick, firstRun.current ? START_DELAY + INTERVAL : INTERVAL)
    firstRun.current = false
    return () => window.clearTimeout(timer)
  }, [inView, reduced, words.length])

  const word = words[index]
  useEffect(() => onChange?.(word), [word, onChange])

  return (
    <motion.span
      className="hero__word"
      aria-hidden="true"
      initial={false}
      animate={{ width: widths[index] }}
      transition={swapped ? { type: 'spring', stiffness: 160, damping: 24 } : { duration: 0 }}
    >
      <span className="hero__word-strut">{'\u200b'}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={`${index}-${word}`}
          className="hero__word-letters"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {[...word].map((ch, i) => (
            <motion.span className="hero__letter" key={i} custom={i} variants={letter}>
              {ch}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}
