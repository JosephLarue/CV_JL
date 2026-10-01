import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import Background from '../components/Background'
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

  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  useEffect(() => {
    fetchContent().then(setContent).catch((e) => setError(e.message))
  }, [])

  if (error) return <Centered>{error}</Centered>
  if (!content) return <Centered>Chargement…</Centered>

  const sections = content.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="relative min-h-screen">
      <Background />

      {/* scroll progress bar */}
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-accent to-accent2"
        style={{ scaleX: progress }}
      />

      <header className="sticky top-0 z-40 border-b border-fg/5 bg-ink/70 backdrop-blur-md">
        <div className="container-cv flex h-14 items-center justify-between">
          <a href="#hero" className="font-mono text-sm font-bold text-strong transition-colors hover:text-accent">
            {content.settings.name}
          </a>
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

      <footer className="border-t border-fg/5 py-10 text-center text-xs text-muted">
        <p>
          © {content.settings.name} — {lang === 'fr' ? 'Conçu & codé avec' : 'Designed & coded with'}{' '}
          <span className="text-accent">React</span> + <span className="text-accent2">Vite</span>
        </p>
      </footer>
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
