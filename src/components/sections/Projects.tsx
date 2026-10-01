import type { ProjectsBlock } from '../../lib/types'
import SectionShell from './SectionShell'

export default function Projects({ data }: { data: ProjectsBlock }) {
  return (
    <SectionShell id="projects" heading={data.heading}>
      <div className="grid gap-5 sm:grid-cols-2">
        {data.items?.map((p, i) => (
          <div key={i} className="card flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{p.name}</h3>
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-accent hover:underline"
                >
                  ↗
                </a>
              )}
            </div>
            <p className="mt-2 flex-1 text-slate-300">{p.description}</p>
            {p.stack && p.stack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.stack.map((s, j) => (
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
