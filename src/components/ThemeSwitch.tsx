import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '../i18n/LangContext'
import { useTheme, type ColorBlind, type Theme } from '../theme/ThemeContext'

const THEMES: { key: Theme; icon: string; fr: string; en: string }[] = [
  { key: 'light', icon: '☀️', fr: 'Clair', en: 'Light' },
  { key: 'dark', icon: '🌙', fr: 'Sombre', en: 'Dark' },
  { key: 'daltonien', icon: '👁️', fr: 'Daltonien', en: 'Color-blind' },
]

const CB_OPTIONS: { key: ColorBlind; fr: string; en: string; swatch: string }[] = [
  { key: 'red', fr: 'Rouge', en: 'Red', swatch: '#ef4444' },
  { key: 'green', fr: 'Vert', en: 'Green', swatch: '#22c55e' },
  { key: 'blue', fr: 'Bleu', en: 'Blue', swatch: '#3b82f6' },
]

export default function ThemeSwitch() {
  const { theme, setTheme, cb, setCb } = useTheme()
  const { lang } = useLang()
  const [open, setOpen] = useState(false)

  const current = THEMES.find((t) => t.key === theme)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost gap-1.5 px-2.5 py-1.5 text-xs"
        aria-haspopup="true"
        aria-expanded={open}
        title={lang === 'fr' ? 'Thème' : 'Theme'}
      >
        <span aria-hidden>{current.icon}</span>
        <span className="hidden sm:inline">{lang === 'fr' ? current.fr : current.en}</span>
        <span aria-hidden className="text-muted">
          ▾
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-fg/10 bg-panel p-2 shadow-xl backdrop-blur"
            >
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTheme(t.key)
                    if (t.key !== 'daltonien') setOpen(false)
                  }}
                  className={
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ' +
                    (theme === t.key ? 'bg-accent/15 text-accent' : 'text-body hover:bg-fg/5')
                  }
                >
                  <span aria-hidden>{t.icon}</span>
                  {lang === 'fr' ? t.fr : t.en}
                  {theme === t.key && <span className="ml-auto text-accent">✓</span>}
                </button>
              ))}

              {theme === 'daltonien' && (
                <div className="mt-2 border-t border-fg/10 pt-2">
                  <p className="px-3 pb-1.5 text-[11px] uppercase tracking-wide text-muted">
                    {lang === 'fr' ? 'Couleur mal perçue' : 'Colour hard to see'}
                  </p>
                  <div className="grid grid-cols-3 gap-1 px-1">
                    {CB_OPTIONS.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setCb(c.key)}
                        className={
                          'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs transition-colors ' +
                          (cb === c.key ? 'bg-accent/15 text-accent' : 'text-body hover:bg-fg/5')
                        }
                      >
                        <span className="h-4 w-4 rounded-full border border-fg/20" style={{ background: c.swatch }} />
                        {lang === 'fr' ? c.fr : c.en}
                      </button>
                    ))}
                  </div>
                  {!cb && (
                    <p className="px-3 pt-2 text-[11px] text-muted">
                      {lang === 'fr'
                        ? 'Choisis la couleur que tu distingues mal — la palette s’adapte.'
                        : 'Pick the colour you struggle to see — the palette adapts.'}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
