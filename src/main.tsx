import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Hero } from './components/Hero'

// ?clone=hero renders the hero alone on its backdrop, for the verify rigs
const params = new URLSearchParams(location.search)
const isolated = params.get('clone') === 'hero'
const num = (k: string) => (params.has(k) ? Number(params.get(k)) : undefined)
const still = params.has('word') || params.has('tick') ? { word: num('word'), tick: num('tick') } : undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isolated ? <Hero still={still} /> : <App />}</StrictMode>,
)
