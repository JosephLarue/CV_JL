import { useLang } from '../i18n/LangContext'
import type { Lang } from '../lib/types'

export default function LangSwitch() {
  const { lang, setLang } = useLang()
  const langs: Lang[] = ['fr', 'en']
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-white/10 text-xs font-semibold">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={
            'px-3 py-1.5 uppercase transition-colors ' +
            (lang === l ? 'bg-accent text-ink' : 'text-slate-300 hover:bg-white/5')
          }
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
