import { useEffect, useRef } from 'react'
import { animate, useInView, useMotionValue, useReducedMotion } from 'motion/react'

const VELOCITY = 60 // px per second, leftward
const HOVER_EASE = { duration: 0.3, ease: [0.25, 0.1, 0.35, 1] as const }

type Client = { src: string; ratio: string }

/**
 * One copy of the list. Items that have scrolled fully past the left edge are
 * shifted by the loop length, so the row never runs out and never duplicates DOM.
 */
export function ClientTicker({ clients }: { clients: Client[] }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const inView = useInView(boxRef, { margin: '100px' })
  const reduced = useReducedMotion()
  const speed = useMotionValue(1)

  useEffect(() => {
    const track = trackRef.current
    if (!track || !inView || reduced) return
    const items = [...track.children] as HTMLElement[]
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    let x = 0
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const first = items[0]
      const lastItem = items[items.length - 1]
      const loop = lastItem.offsetLeft + lastItem.offsetWidth + gap - first.offsetLeft
      x = (x + VELOCITY * speed.get() * dt) % loop
      track.style.transform = `translateX(${-x}px)`
      for (const li of items) {
        const right = li.offsetLeft - first.offsetLeft + li.offsetWidth
        li.style.transform = right <= x ? `translateX(${loop}px)` : 'none'
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, speed])

  return (
    <div
      className="hero__ticker"
      ref={boxRef}
      onPointerEnter={() => animate(speed, 0, HOVER_EASE)}
      onPointerLeave={() => animate(speed, 1, HOVER_EASE)}
    >
      <div className="hero__ticker-clip">
        <ul className="hero__ticker-track" ref={trackRef}>
          {clients.map((c, i) => (
            <li className="hero__ticker-item" key={i}>
              <div className="hero__client">
                <div className="hero__client-logo" style={{ aspectRatio: c.ratio }}>
                  <div className="hero__fill">
                    <img src={c.src} alt="" />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
