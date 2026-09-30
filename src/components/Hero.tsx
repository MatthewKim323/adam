import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { ClientTicker } from './ClientTicker'
import { RotatingWord, useWordWidths } from './RotatingWord'
import { TypedPlaceholder } from './TypedPlaceholder'
import './Hero.css'

const LEDE =
  'Seo helps you analyze, optimize, and dominate search rankings with  AI-powered SEO tools built for real growth — not just reports.'

const PLACEHOLDER = 'Enter your professional email address...'

const WORDS = ['customers', 'leads', 'sign-ups', 'revenue', 'buyers']

const CLIENTS = [
  { src: '/hero/images/img-01f947d876.svg', ratio: '3.02222 / 1' },
  { src: '/hero/images/img-eb733ee1cc.svg', ratio: '2.86667 / 1' },
  { src: '/hero/images/img-286c7f604a.svg', ratio: '3.28889 / 1' },
  { src: '/hero/images/img-5eccafd1cd.svg', ratio: '2.75556 / 1' },
  { src: '/hero/images/img-9d7deef1d1.svg', ratio: '3.55556 / 1' },
  { src: '/hero/images/img-1d8c745e0b.svg', ratio: '3.64444 / 1' },
  { src: '/hero/images/img-d053601423.svg', ratio: '2.75556 / 1' },
  { src: '/hero/images/img-d98c0cb724.svg', ratio: '3.73333 / 1' },
  { src: '/hero/images/img-b9f3f6573f.svg', ratio: '3.06667 / 1' },
  { src: '/hero/images/img-01f947d876.svg', ratio: '3.02222 / 1' },
]

const STAR_PATH =
  'M 9.749 15.477 L 14.879 18.632 C 15.151 18.797 15.496 18.782 15.753 18.594 C 16.01 18.406 16.128 18.082 16.053 17.772 L 14.658 11.886 L 19.223 7.948 C 19.461 7.739 19.552 7.409 19.455 7.108 C 19.357 6.806 19.09 6.592 18.774 6.563 L 12.783 6.075 L 10.475 0.488 C 10.354 0.193 10.068 0 9.749 0 C 9.431 0 9.144 0.193 9.023 0.488 L 6.715 6.075 L 0.724 6.563 C 0.406 6.59 0.136 6.806 0.038 7.109 C -0.06 7.412 0.034 7.745 0.275 7.953 L 4.84 11.89 L 3.445 17.772 C 3.37 18.082 3.488 18.406 3.745 18.594 C 4.002 18.782 4.347 18.797 4.619 18.632 Z'

const enter = (y: number, delay: number, amount = 0.3) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount },
  transition: { type: 'spring' as const, bounce: 0.2, duration: 0.6, delay },
})

function Star() {
  return (
    <svg className="hero__star" role="presentation" viewBox="0 0 24 24">
      <path d={STAR_PATH} fill="var(--hero-accent)" transform="translate(2.251 2.25)" />
      <path
        d={STAR_PATH}
        fill="transparent"
        stroke="var(--hero-accent)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(2.251 2.25)"
      />
    </svg>
  )
}

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [measureRef, widths] = useWordWidths()
  const [word, setWord] = useState(WORDS[0])
  const [email, setEmail] = useState('')
  // once something was typed, the native placeholder takes over for good
  const [touched, setTouched] = useState(false)
  const videoInView = useInView(videoRef)

  // the background loop only plays while it can be seen
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const sync = () => {
      if (videoInView && !document.hidden) video.play().catch(() => {})
      else video.pause()
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [videoInView])

  return (
    <div className="hero" data-clone-root ref={rootRef}>
      <div className="hero__main">
        <div className="hero__bg">
          <video ref={videoRef} src="/hero/videos/vid-7d635e9887.mp4" autoPlay loop muted playsInline preload="auto" />
        </div>
        <div className="hero__content">
          <div className="hero__top">
            <div className="hero__intro">
              <motion.div className="hero__trust" {...enter(60, 0)}>
                <div className="hero__label">
                  <p className="hero__text hero__text--eyebrow" dir="auto">
                    They trust us
                  </p>
                </div>
                <div className="hero__rating">
                  <div className="hero__stars">
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                    <Star />
                  </div>
                  <div className="hero__label">
                    <p className="hero__text hero__text--small" dir="auto">
                      4,9
                    </p>
                  </div>
                  <div className="hero__g">
                    <div className="hero__fill">
                      <img width={14} height={14} src="/hero/images/img-8233747ca1.svg" alt="" />
                    </div>
                  </div>
                </div>
              </motion.div>
              <div className="hero__headline-group">
                <motion.div className="hero__heading" {...enter(30, 0.1)}>
                  <div className="hero__heading-inner">
                    <h1 className="hero__h1" aria-label={`Turn traffic into ${word} automatically`}>
                      {'Turn traffic into '}
                      <RotatingWord words={WORDS} widths={widths} scope={rootRef} onChange={setWord} />
                      <br />
                      automatically
                    </h1>
                    <div className="hero__measure" aria-hidden="true" ref={measureRef}>
                      {WORDS.map((w) => (
                        <span key={w}>{w}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
                <motion.div className="hero__lede" {...enter(60, 0.2, 0)}>
                  <p className="hero__text hero__text--lede" dir="auto">
                    {LEDE}
                  </p>
                </motion.div>
              </div>
            </div>
            <motion.div className="hero__form" {...enter(60, 0.3)}>
              <div className="hero__pill">
                <div className="hero__field">
                  <input
                    className="hero__input"
                    type="email"
                    name="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (e.target.value) setTouched(true)
                    }}
                    placeholder={touched ? PLACEHOLDER : ''}
                  />
                  <TypedPlaceholder text={PLACEHOLDER} hidden={touched} />
                </div>
                <a className="hero__send" href="./">
                  <div className="hero__send-icon">
                    <div className="hero__fill">
                      <img width={20} height={20} src="/hero/images/img-c8daaa9ec0.svg" alt="" />
                    </div>
                  </div>
                </a>
              </div>
              <div className="hero__note">
                <p className="hero__text hero__text--note" dir="auto">
                  Give it a try with our 14-day free trial—no credit card needed!
                </p>
              </div>
            </motion.div>
          </div>
          <motion.div className="hero__clients" {...enter(60, 0.4)}>
            <div className="hero__clients-head">
              <div className="hero__rule" />
              <div className="hero__label">
                <p className="hero__text hero__text--small" dir="auto">
                  Trusted by the best.
                </p>
              </div>
              <div className="hero__rule" />
            </div>
            <div className="hero__clients-row">
              <ClientTicker clients={CLIENTS} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
