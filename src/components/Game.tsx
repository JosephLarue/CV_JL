import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lang } from '../lib/types'

const GRID = 17
const CELL = 20
const SIZE = GRID * CELL
const HS_KEY = 'cv_snake_hs'

type P = { x: number; y: number }
const eq = (a: P, b: P) => a.x === b.x && a.y === b.y

function cssVar(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v ? `rgb(${v})` : '#38bdf8'
}

export default function Game({ onClose, lang }: { onClose: () => void; lang: Lang }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<P[]>([{ x: 8, y: 8 }])
  const dirRef = useRef<P>({ x: 1, y: 0 })
  const nextDirRef = useRef<P>({ x: 1, y: 0 })
  const foodRef = useRef<P>({ x: 12, y: 8 })

  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem(HS_KEY) || 0))

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en)

  const spawnFood = useCallback(() => {
    const snake = snakeRef.current
    let p: P
    do {
      p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
    } while (snake.some((s) => eq(s, p)))
    foodRef.current = p
  }, [])

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const accent = cssVar('--accent')
    const accent2 = cssVar('--accent2')
    const ink = cssVar('--ink')

    ctx.fillStyle = ink
    ctx.fillRect(0, 0, SIZE, SIZE)

    // grid
    ctx.strokeStyle = 'rgba(148,163,184,0.08)'
    ctx.lineWidth = 1
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL, 0)
      ctx.lineTo(i * CELL, SIZE)
      ctx.moveTo(0, i * CELL)
      ctx.lineTo(SIZE, i * CELL)
      ctx.stroke()
    }

    // food
    const f = foodRef.current
    ctx.fillStyle = accent2
    ctx.shadowColor = accent2
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL / 2.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // snake
    const snake = snakeRef.current
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? accent : accent
      ctx.globalAlpha = i === 0 ? 1 : Math.max(0.35, 1 - i / (snake.length + 3))
      const pad = 2
      roundRect(ctx, s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 5)
      ctx.fill()
    })
    ctx.globalAlpha = 1
  }, [])

  const tick = useCallback(() => {
    const snake = snakeRef.current
    dirRef.current = nextDirRef.current
    const d = dirRef.current
    const head = { x: snake[0].x + d.x, y: snake[0].y + d.y }

    const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID
    const hitSelf = snake.some((s) => eq(s, head))
    if (hitWall || hitSelf) {
      setRunning(false)
      setOver(true)
      setScore((sc) => {
        setBest((b) => {
          const nb = Math.max(b, sc)
          localStorage.setItem(HS_KEY, String(nb))
          return nb
        })
        return sc
      })
      return
    }

    snake.unshift(head)
    if (eq(head, foodRef.current)) {
      setScore((s) => s + 1)
      spawnFood()
    } else {
      snake.pop()
    }
    draw()
  }, [draw, spawnFood])

  // game loop — speed scales with score
  useEffect(() => {
    if (!running) return
    const speed = Math.max(70, 140 - score * 4)
    const id = setInterval(tick, speed)
    return () => clearInterval(id)
  }, [running, score, tick])

  const setDir = useCallback((x: number, y: number) => {
    const cur = dirRef.current
    if (cur.x === -x && cur.y === -y) return // no reverse
    if (cur.x === x && cur.y === y) return
    nextDirRef.current = { x, y }
  }, [])

  const start = useCallback(() => {
    snakeRef.current = [
      { x: 8, y: 8 },
      { x: 7, y: 8 },
      { x: 6, y: 8 },
    ]
    dirRef.current = { x: 1, y: 0 }
    nextDirRef.current = { x: 1, y: 0 }
    spawnFood()
    setScore(0)
    setOver(false)
    setRunning(true)
    draw()
  }, [draw, spawnFood])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
        z: [0, -1], q: [-1, 0],
      }
      const m = map[e.key]
      if (m) {
        e.preventDefault()
        if (!running && !over) start()
        setDir(m[0], m[1])
      } else if (e.key === ' ') {
        e.preventDefault()
        if (!running) start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, running, over, start, setDir])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card w-full max-w-md"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-strong">
            <span className="font-mono text-accent">🐍</span> Snake
          </h2>
          <button onClick={onClose} className="btn-ghost px-2.5 py-1 text-xs">
            ✕ {t('Fermer', 'Close')}
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between font-mono text-sm">
          <span className="text-body">
            {t('Score', 'Score')}: <span className="text-accent">{score}</span>
          </span>
          <span className="text-muted">
            {t('Record', 'Best')}: <span className="text-accent2">{best}</span>
          </span>
        </div>

        <div className="relative mx-auto" style={{ width: SIZE, maxWidth: '100%' }}>
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="w-full rounded-lg border border-fg/10"
            style={{ touchAction: 'none', aspectRatio: '1 / 1' }}
          />
          {(!running || over) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-ink/80 text-center backdrop-blur-sm">
              {over && (
                <p className="font-mono text-sm text-accent2">
                  {t('Perdu !', 'Game over!')} {score > 0 && `${score} 🍎`}
                </p>
              )}
              <button onClick={start} className="btn-accent">
                {over ? t('Rejouer', 'Play again') : t('Jouer', 'Play')}
              </button>
              <p className="max-w-[16rem] text-xs text-muted">
                {t('Flèches / WASD pour diriger.', 'Arrows / WASD to steer.')}
              </p>
            </div>
          )}
        </div>

        {/* touch d-pad */}
        <div className="mx-auto mt-4 grid w-40 grid-cols-3 gap-1.5 sm:hidden">
          <span />
          <button className="btn-ghost py-2" onClick={() => { if (!running && !over) start(); setDir(0, -1) }}>▲</button>
          <span />
          <button className="btn-ghost py-2" onClick={() => { if (!running && !over) start(); setDir(-1, 0) }}>◀</button>
          <button className="btn-ghost py-2" onClick={() => { if (!running && !over) start(); setDir(0, 1) }}>▼</button>
          <button className="btn-ghost py-2" onClick={() => { if (!running && !over) start(); setDir(1, 0) }}>▶</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
