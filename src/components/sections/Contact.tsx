import type { ContactBlock } from '../../lib/types'
import SectionShell from './SectionShell'

export default function Contact({ data }: { data: ContactBlock }) {
  const rows: { label: string; value?: string; href?: string }[] = [
    { label: 'Email', value: data.email, href: data.email ? `mailto:${data.email}` : undefined },
    { label: 'Téléphone', value: data.phone, href: data.phone ? `tel:${data.phone}` : undefined },
    { label: 'Localisation', value: data.location },
    { label: 'GitHub', value: data.github, href: data.github },
    { label: 'LinkedIn', value: data.linkedin, href: data.linkedin },
  ].filter((r) => r.value)

  return (
    <SectionShell id="contact" heading={data.heading}>
      <div className="grid gap-3 sm:max-w-xl">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-panel/40 px-4 py-3">
            <span className="label">{r.label}</span>
            {r.href ? (
              <a href={r.href} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                {r.value}
              </a>
            ) : (
              <span className="text-slate-200">{r.value}</span>
            )}
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
