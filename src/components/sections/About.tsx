import { motion } from 'framer-motion'
import type { AboutBlock } from '../../lib/types'
import SectionShell from './SectionShell'

export default function About({ data }: { data: AboutBlock }) {
  return (
    <SectionShell id="about" heading={data.heading}>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-slate-300"
      >
        {data.body}
      </motion.p>
    </SectionShell>
  )
}
