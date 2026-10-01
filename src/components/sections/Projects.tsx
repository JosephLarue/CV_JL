import type { ProjectsBlock } from '../../lib/types'
import { Item, Reveal } from '../motion'
import SectionShell from './SectionShell'

export default function Projects({ data }: { data: ProjectsBlock }) {
  return (
    <SectionShell id="projects" heading={data.heading}>
      <Reveal className="grid gap-5 sm:grid-cols-2">
        {data.items?.map((p, i) => (
          <Item key={i}>
            <a
              href={p.link || undefined}
              target={p.link ? '_blank' : undefined}
              rel="noreferrer"
              className="card card-hover group flex h-full flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-strong">{p.name}</h3>
                {p.link && <span className="font-mono text-accent transition-transform group-hover:translate-x-1">↗</span>}
              </div>
              <p className="mt-2 flex-1 text-body">{p.description}</p>
              {p.stack && p.stack.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.stack.map((s, j) => (
                    <span key={j} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </a>
          </Item>
        ))}
      </Reveal>
    </SectionShell>
  )
}
