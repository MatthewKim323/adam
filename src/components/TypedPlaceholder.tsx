import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

const FIRST_CHAR = 45
const CARET_HOLD = 1400
const MAX_WAIT = 3000

/** combined opacity of an element and its ancestors, so typing waits for the entrance fade */
function effectiveOpacity(el: Element | null) {
  let o = 1
  for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity)
  return o
}

type Props = {
  text: string
  /** true once the field holds a value: the overlay steps aside for the native placeholder */
  hidden: boolean
}

export function TypedPlaceholder({ text, hidden }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'typing' | 'done'>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    let timers: number[] = []
    let poll = 0
    const type = () => {
      setPhase('typing')
      let t = FIRST_CHAR
      for (let i = 1; i <= text.length; i++) {
        timers.push(window.setTimeout(() => setCount(i), t))
        t += 45 + Math.random() * 30 + (/[\s.,]/.test(text[i - 1]) ? 40 : 0)
      }
      const last = t - (45 + Math.random() * 30)
      timers.push(window.setTimeout(() => setPhase('done'), last + CARET_HOLD))
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const started = performance.now()
        poll = window.setInterval(() => {
          if (effectiveOpacity(el) >= 0.9 || performance.now() - started >= MAX_WAIT) {
            window.clearInterval(poll)
            type()
          }
        }, 50)
      },
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearInterval(poll)
      timers.forEach(window.clearTimeout)
      timers = []
    }
  }, [text, reduced])

  if (reduced || hidden) return null
  return (
    <div className="hero__placeholder" aria-hidden="true" ref={ref}>
      <span>{text.slice(0, count)}</span>
      <span className={`hero__caret${phase === 'typing' ? ' hero__caret--blink' : ''}`} />
    </div>
  )
}
