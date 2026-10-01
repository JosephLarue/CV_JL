import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearToken, fetchContent, getToken, saveContent } from '../../lib/api'
import type { Content, Lang, Section } from '../../lib/types'
import { SECTION_LABELS } from '../../lib/types'
import ThemeSwitch from '../../components/ThemeSwitch'
import Login from './Login'
import SectionEditor from './SectionEditor'

export default function Admin() {
  const [authed, setAuthed] = useState<boolean>(() => !!getToken())
  const [content, setContent] = useState<Content | null>(null)
  const [lang, setLang] = useState<Lang>('fr')
  const [editing, setEditing] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authed) fetchContent().then(setContent).catch((e) => setStatus(e.message))
  }, [authed])

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />
  if (!content) return <div className="p-8 text-muted">{status ?? 'Chargement…'}</div>

  const sections = [...content.sections].sort((a, b) => a.order - b.order)

  const patchSection = (id: string, patch: Partial<Section>) =>
    setContent({
      ...content,
      sections: content.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })

  const move = (id: string, dir: -1 | 1) => {
    const ordered = sections
    const i = ordered.findIndex((s) => s.id === id)
    const j = i + dir
    if (j < 0 || j >= ordered.length) return
    const next = [...ordered]
    ;[next[i], next[j]] = [next[j], next[i]]
    setContent({
      ...content,
      sections: next.map((s, idx) => ({ ...s, order: idx })),
    })
  }

  async function save() {
    if (!content) return
    setSaving(true)
    setStatus(null)
    try {
      await saveContent(content)
      setStatus('✓ Sauvegardé')
    } catch (e) {
      setStatus((e as Error).message)
      if ((e as Error).message.includes('Session')) setAuthed(false)
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    clearToken()
    setAuthed(false)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-fg/5 bg-ink/90 backdrop-blur">
        <div className="container-cv flex h-14 items-center justify-between">
          <h1 className="font-mono text-sm font-bold text-strong">Backoffice CV</h1>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <div className="inline-flex overflow-hidden rounded-lg border border-fg/10 text-xs font-semibold">
              {(['fr', 'en'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={'px-3 py-1.5 uppercase ' + (lang === l ? 'bg-accent text-ink' : 'text-body hover:bg-fg/5')}
                >
                  {l}
                </button>
              ))}
            </div>
            <Link to="/" className="btn-ghost text-xs">
              Voir le site
            </Link>
            <button onClick={save} className="btn-accent text-xs" disabled={saving}>
              {saving ? '…' : 'Sauvegarder'}
            </button>
            <button onClick={logout} className="text-xs text-muted hover:text-body">
              Déconnexion
            </button>
          </div>
        </div>
        {status && <div className="container-cv pb-2 text-xs text-muted">{status}</div>}
      </header>

      <main className="container-cv space-y-3 py-6">
        {sections.map((s, i) => (
          <div key={s.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted">{String(i).padStart(2, '0')}</span>
                <span className="font-semibold text-strong">{SECTION_LABELS[s.type]}</span>
                <span className="chip">{s.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn-ghost px-2 py-1 text-xs" onClick={() => move(s.id, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button
                  className="btn-ghost px-2 py-1 text-xs"
                  onClick={() => move(s.id, 1)}
                  disabled={i === sections.length - 1}
                >
                  ↓
                </button>
                <label className="ml-2 inline-flex cursor-pointer items-center gap-2 text-xs text-body">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => patchSection(s.id, { enabled: e.target.checked })}
                  />
                  Actif
                </label>
                <button
                  className="btn-ghost ml-2 text-xs"
                  onClick={() => setEditing(editing === s.id ? null : s.id)}
                >
                  {editing === s.id ? 'Fermer' : 'Éditer'}
                </button>
              </div>
            </div>

            {editing === s.id && (
              <div className="mt-4 border-t border-fg/10 pt-4">
                <SectionEditor
                  section={s}
                  lang={lang}
                  onChange={(block) =>
                    patchSection(s.id, { content: { ...s.content, [lang]: block } })
                  }
                />
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  )
}
