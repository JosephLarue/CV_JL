import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

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
    <section id={id} className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-cv">
        <motion.h2
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex items-center gap-3 text-3xl font-bold text-strong"
        >
          <span className="font-mono text-accent">#</span>
          {heading}
          <span className="ml-2 h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
        </motion.h2>
        {children}
      </div>
    </section>
  )
}
