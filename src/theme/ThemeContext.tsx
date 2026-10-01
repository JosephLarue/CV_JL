import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light' | 'daltonien'
/** Colour the user perceives poorly (only for daltonien theme). */
export type ColorBlind = 'red' | 'green' | 'blue'

interface ThemeCtx {
  theme: Theme
  setTheme: (t: Theme) => void
  cb: ColorBlind | null
  setCb: (c: ColorBlind) => void
}

const Ctx = createContext<ThemeCtx | null>(null)
const THEME_KEY = 'cv_theme'
const CB_KEY = 'cv_cb'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const s = localStorage.getItem(THEME_KEY)
    return s === 'light' || s === 'daltonien' || s === 'dark' ? s : 'dark'
  })
  const [cb, setCbState] = useState<ColorBlind | null>(() => {
    const s = localStorage.getItem(CB_KEY)
    return s === 'red' || s === 'green' || s === 'blue' ? s : null
  })

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    if (theme === 'daltonien' && cb) root.dataset.cb = cb
    else delete root.dataset.cb
    localStorage.setItem(THEME_KEY, theme)
    if (cb) localStorage.setItem(CB_KEY, cb)
  }, [theme, cb])

  const setTheme = (t: Theme) => setThemeState(t)
  const setCb = (c: ColorBlind) => setCbState(c)

  return <Ctx.Provider value={{ theme, setTheme, cb, setCb }}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
