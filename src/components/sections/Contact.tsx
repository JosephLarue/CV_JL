import type { ContactBlock } from '../../lib/types'
import { Item, Reveal } from '../motion'
import SectionShell from './SectionShell'

export default function Contact({ data }: { data: ContactBlock }) {
  const rows: { label: string; value?: string; href?: string }[] = [
    { label: 'Email', value: data.email, href: data.email ? `mailto:${data.email}` : undefined },
    { label: 'Téléphone', value: data.phone, href: data.phone ? `tel:${data.phone.replace(/\s/g, '')}` : undefined },
    { label: 'Localisation', value: data.location },
    { label: 'GitHub', value: data.github, href: data.github },
    { label: 'LinkedIn', value: data.linkedin, href: data.linkedin },
  ].filter((r) => r.value)

  return (
    <SectionShell id="contact" heading={data.heading}>
      <Reveal className="grid gap-3 sm:max-w-xl">
        {rows.map((r, i) => (
          <Item key={i}>
            {r.href ? (
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="card card-hover group flex items-center justify-between gap-4"
              >
                <span className="label">{r.label}</span>
                <span className="text-accent transition-transform group-hover:translate-x-1">
                  {prettify(r.value!)} →
                </span>
              </a>
            ) : (
              <div className="card flex items-center justify-between gap-4">
                <span className="label">{r.label}</span>
                <span className="text-body">{r.value}</span>
              </div>
            )}
          </Item>
        ))}
      </Reveal>
    </SectionShell>
  )
}

/** Shorten long URLs for display. */
function prettify(v: string): string {
  return v.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}
