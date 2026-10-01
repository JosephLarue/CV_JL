import type { EducationBlock } from '../../lib/types'
import { Item, Reveal } from '../motion'
import SectionShell from './SectionShell'

export default function Education({ data }: { data: EducationBlock }) {
  return (
    <SectionShell id="education" heading={data.heading}>
      <Reveal className="space-y-4">
        {data.items?.map((it, i) => (
          <Item key={i}>
            <div className="card card-hover flex flex-wrap items-baseline justify-between gap-2 border-l-2 border-accent/40">
              <div>
                <h3 className="font-semibold text-strong">{it.degree}</h3>
                <p className="text-muted">{it.school}</p>
              </div>
              <span className="chip font-mono">{it.period}</span>
            </div>
          </Item>
        ))}
      </Reveal>
    </SectionShell>
  )
}
