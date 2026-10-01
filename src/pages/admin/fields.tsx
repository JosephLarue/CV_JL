/** Small reusable field primitives for the section editor. */

export function Text({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
}) {
  return (
    <label className="block space-y-1.5">
      <span className="label">{label}</span>
      {textarea ? (
        <textarea
          className="input min-h-[96px] resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

export function TagList({
  label,
  value,
  onChange,
}: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <Text
      label={`${label} (séparés par des virgules)`}
      value={(value ?? []).join(', ')}
      onChange={(v) =>
        onChange(
          v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }
    />
  )
}

export function ArrayEditor<T>({
  label,
  items,
  onChange,
  blank,
  render,
}: {
  label: string
  items: T[]
  onChange: (v: T[]) => void
  blank: () => T
  render: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode
}) {
  const list = items ?? []
  const update = (i: number, patch: Partial<T>) =>
    onChange(list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <button type="button" className="btn-ghost text-xs" onClick={() => onChange([...list, blank()])}>
          + Ajouter
        </button>
      </div>
      {list.map((item, i) => (
        <div key={i} className="rounded-lg border border-fg/10 bg-ink/40 p-3">
          <div className="mb-2 flex items-center justify-end gap-1">
            <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => move(i, -1)}>
              ↑
            </button>
            <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => move(i, 1)}>
              ↓
            </button>
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs text-red-400"
              onClick={() => remove(i)}
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">{render(item, (patch) => update(i, patch))}</div>
        </div>
      ))}
    </div>
  )
}
