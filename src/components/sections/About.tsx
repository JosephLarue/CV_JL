import type { AboutBlock } from '../../lib/types'
import SectionShell from './SectionShell'

export default function About({ data }: { data: AboutBlock }) {
  return (
    <SectionShell id="about" heading={data.heading}>
      <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-slate-300">
        {data.body}
      </p>
    </SectionShell>
  )
}
