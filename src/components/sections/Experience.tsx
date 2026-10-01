import type { ExperienceBlock } from '../../lib/types'
import { Item, Reveal } from '../motion'
import SectionShell from './SectionShell'

export default function Experience({ data }: { data: ExperienceBlock }) {
  return (
    <SectionShell id="experience" heading={data.heading}>
      <Reveal className="relative space-y-6 before:absolute before:left-[7px] before:top-2 before:h-full before:w-px before:bg-gradient-to-b before:from-accent/50 before:to-transparent sm:pl-8">
        {data.items?.map((it, i) => (
          <Item key={i}>
            <div className="relative">
              <span className="absolute -left-8 top-6 hidden h-3.5 w-3.5 rounded-full border-2 border-accent bg-ink sm:block" />
              <div className="card card-hover">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    {it.role} <span className="text-accent">· {it.company}</span>
                  </h3>
                  <span className="chip font-mono">{it.period}</span>
                </div>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-300">
                  {it.description}
                </p>
                {it.stack && it.stack.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {it.stack.map((s, j) => (
                      <span key={j} className="chip">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Item>
        ))}
      </Reveal>
    </SectionShell>
  )
}
