import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LangSwitch from '../components/LangSwitch'
import SectionRenderer from '../components/sections/SectionRenderer'
import { useLang } from '../i18n/LangContext'
import { fetchContent } from '../lib/api'
import type { Content } from '../lib/types'

export default function Landing() {
  const { lang } = useLang()
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContent().then(setContent).catch((e) => setError(e.message))
  }, [])

  if (error) return <Centered>{error}</Centered>
  if (!content) return <Centered>Chargement…</Centered>

  const sections = content.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur">
        <div className="container-cv flex h-14 items-center justify-between">
          <span className="font-mono text-sm font-bold text-white">
            {content.settings.name}
          </span>
          <div className="flex items-center gap-3">
            <LangSwitch />
            <Link to="/admin" className="text-xs text-slate-500 hover:text-slate-300">
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

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        © {content.settings.name}
      </footer>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">{children}</div>
  )
}
