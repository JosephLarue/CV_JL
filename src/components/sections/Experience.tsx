import type { ExperienceBlock } from '../../lib/types'
import SectionShell from './SectionShell'

export default function Experience({ data }: { data: ExperienceBlock }) {
  return (
    <SectionShell id="experience" heading={data.heading}>
      <div className="space-y-6">
        {data.items?.map((it, i) => (
          <div key={i} className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-white">
                {it.role} <span className="text-accent">· {it.company}</span>
              </h3>
              <span className="font-mono text-xs text-slate-400">{it.period}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-slate-300">{it.description}</p>
            {it.stack && it.stack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {it.stack.map((s, j) => (
                  <span key={j} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
