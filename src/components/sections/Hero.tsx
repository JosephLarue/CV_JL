import { useRef } from 'react'
import { motion } from 'framer-motion'
import type { HeroBlock } from '../../lib/types'

export default function Hero({ data, name }: { data: HeroBlock; name: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  }
  const item = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  }

  return (
    <section
      id="hero"
      ref={ref}
      onMouseMove={onMove}
      className="group relative flex min-h-[88vh] items-center overflow-hidden"
    >
      {/* mouse-follow glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(400px circle at var(--mx) var(--my), rgba(255,78,205,0.14), transparent 70%)',
        }}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="container-cv">
        <motion.p variants={item} className="font-mono text-sm text-accent">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent align-middle" />
          {name}
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
        >
          <span className="gradient-text">{data.title}</span>
        </motion.h1>

        <motion.p variants={item} className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          {data.subtitle}
        </motion.p>

        {data.ctaLabel && (
          <motion.div variants={item} className="mt-9">
            <a href="#contact" className="btn-accent text-base">
              {data.ctaLabel}
              <span aria-hidden>→</span>
            </a>
          </motion.div>
        )}
      </motion.div>

      {/* scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
          <motion.div
            className="h-2 w-1 rounded-full bg-accent"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  )
}
