import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import Background from '../components/Background'
import Game from '../components/Game'
import Pong from '../components/Pong'
import Race from '../components/Race'
import LangSwitch from '../components/LangSwitch'
import ThemeSwitch from '../components/ThemeSwitch'
import SectionRenderer from '../components/sections/SectionRenderer'
import { useLang } from '../i18n/LangContext'
import { fetchContent } from '../lib/api'
import type { Content } from '../lib/types'

export default function Landing() {
  const { lang } = useLang()
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [atBottom, setAtBottom] = useState(false)
  const [game, setGame] = useState<'snake' | 'pong' | 'race' | null>(null)

  const pickGame = () => {
    const r = Math.random()
    setGame(r < 1 / 3 ? 'snake' : r < 2 / 3 ? 'pong' : 'race')
  }

  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  useEffect(() => {
    fetchContent().then(setContent).catch((e) => setError(e.message))
  }, [])

  // Reveal the bottom easter-egg only when the footer is at the viewport bottom,
  // so the fixed message never leaks over mid-page content.
  useEffect(() => {
    const se = document.scrollingElement || document.documentElement
    const onScroll = () => setAtBottom(se.scrollTop + se.clientHeight >= se.scrollHeight - 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [content])

  if (error) return <Centered>{error}</Centered>
  if (!content) return <Centered>Chargement…</Centered>

  const sections = content.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="relative min-h-screen">
      {/* Pinned to the viewport top, behind the header. The opaque header covers it;
          on macOS rubber-band overscroll the header slides down and reveals this. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-center text-center font-mono text-sm font-medium text-muted">
        <span className="animate-float">
          {lang === 'fr'
            ? '😵‍💫 Trop loin, arrête, tu vas me déchirer !'
            : "😵‍💫 Too far stop you'll tear me appart !"}
        </span>
      </div>

      <Background />

      {/* scroll progress bar */}
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-accent to-accent2"
        style={{ scaleX: progress }}
      />

      <header className="sticky top-0 z-40 border-b border-fg/5 bg-ink/95 backdrop-blur-md">
        <div className="container-cv flex h-14 items-center justify-between">
          <button
            onClick={pickGame}
            className="group font-mono text-sm font-bold text-strong transition-colors hover:text-accent"
            title={lang === 'fr' ? 'Clique pour jouer 🎮' : 'Click to play 🎮'}
          >
            {content.settings.name}
            <span className="ml-1.5 opacity-0 transition-opacity group-hover:opacity-100">🎮</span>
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitch />
            <LangSwitch />
            <Link to="/admin" className="text-xs text-muted transition-colors hover:text-body">
              admin
            </Link>
          </div>
        </div>
      </header>

      <main>
        {sections.map((s) => (
          <SectionRenderer key={s.id} section={s} lang={lang} name={content.settings.name} />
        ))}
      </main>

      {/* Pinned to the viewport bottom, behind the opaque footer. Only mounted when at
          the page bottom (no mid-page leak); on downward rubber-band overscroll the
          footer slides up and reveals this. */}
      {atBottom && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex h-24 items-center justify-center text-center font-mono text-sm font-medium text-muted">
          <span className="animate-float">
            {lang === 'fr'
              ? "🫠 C'est fini — t'as atteint le fond d'internet !"
              : "🫠 That's all folks — you reached the bottom of the internet !"}
          </span>
        </div>
      )}

      <footer className="relative z-40 border-t border-fg/5 bg-ink py-10 text-center text-xs text-muted">
        <p>
          © {content.settings.name} — {lang === 'fr' ? 'Conçu & codé avec' : 'Designed & coded with'}{' '}
          <span className="text-accent">React</span> + <span className="text-accent2">Vite</span>
        </p>
      </footer>

      <AnimatePresence>
        {game === 'snake' && <Game onClose={() => setGame(null)} lang={lang} />}
        {game === 'pong' && <Pong onClose={() => setGame(null)} lang={lang} />}
        {game === 'race' && <Race onClose={() => setGame(null)} lang={lang} />}
      </AnimatePresence>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted">
      <Background />
      <span className="animate-pulse">{children}</span>
    </div>
  )
}
