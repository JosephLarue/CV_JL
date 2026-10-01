import type { ReactNode } from 'react'

export default function SectionShell({
  id,
  heading,
  children,
}: {
  id: string
  heading: string
  children: ReactNode
}) {
  return (
    <section id={id} className="border-t border-white/5 py-16 sm:py-20">
      <div className="container-cv">
        <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-white">
          <span className="font-mono text-accent">#</span>
          {heading}
        </h2>
        {children}
      </div>
    </section>
  )
}
