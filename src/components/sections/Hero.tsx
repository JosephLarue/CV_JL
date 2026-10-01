import type { HeroBlock } from '../../lib/types'

export default function Hero({ data, name }: { data: HeroBlock; name: string }) {
  return (
    <section id="hero" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(56,189,248,0.12),transparent)]" />
      <div className="container-cv">
        <p className="font-mono text-sm text-accent">{name}</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-white sm:text-6xl">
          {data.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-400">{data.subtitle}</p>
        {data.ctaLabel && (
          <a href="#contact" className="btn-accent mt-8">
            {data.ctaLabel}
          </a>
        )}
      </div>
    </section>
  )
}
