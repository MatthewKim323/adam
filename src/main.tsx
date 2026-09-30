import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Hero } from './components/Hero'

// ?clone=hero renders the hero alone on its backdrop, for the verify rigs
const isolated = new URLSearchParams(location.search).get('clone') === 'hero'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isolated ? <Hero /> : <App />}</StrictMode>,
)
