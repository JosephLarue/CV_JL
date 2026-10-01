import type { SkillsBlock } from '../../lib/types'
import SectionShell from './SectionShell'

export default function Skills({ data }: { data: SkillsBlock }) {
  return (
    <SectionShell id="skills" heading={data.heading}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.groups?.map((g, i) => (
          <div key={i} className="card">
            <h3 className="mb-3 font-mono text-sm text-accent2">{g.group}</h3>
            <div className="flex flex-wrap gap-2">
              {g.items?.map((item, j) => (
                <span key={j} className="chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
