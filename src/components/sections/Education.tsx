import type { EducationBlock } from '../../lib/types'
import SectionShell from './SectionShell'

export default function Education({ data }: { data: EducationBlock }) {
  return (
    <SectionShell id="education" heading={data.heading}>
      <div className="space-y-4">
        {data.items?.map((it, i) => (
          <div key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-l-2 border-accent/40 pl-4">
            <div>
              <h3 className="font-semibold text-white">{it.degree}</h3>
              <p className="text-slate-400">{it.school}</p>
            </div>
            <span className="font-mono text-xs text-slate-400">{it.period}</span>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
