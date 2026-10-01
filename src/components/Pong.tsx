import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lang } from '../lib/types'

const W = 360
const H = 260
const PADDLE_W = 9
const PADDLE_H = 54
const BALL_R = 6
const WIN = 5
const HS_KEY = 'cv_pong_wins'

function cssVar(name: string, fb: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v ? `rgb(${v})` : fb
}

export default function Pong({ onClose, lang }: { onClose: () => void; lang: Lang }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerY = useRef((H - PADDLE_H) / 2)
  const cpuY = useRef((H - PADDLE_H) / 2)
  const ball = useRef({ x: W / 2, y: H / 2, vx: 3.2, vy: 2 })
  const keys = useRef<Set<string>>(new Set())
  const rafRef = useRef<number>(0)

  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [winner, setWinner] = useState<'you' | 'cpu' | null>(null)
  const [pScore, setPScore] = useState(0)
  const [cScore, setCScore] = useState(0)
  const [wins, setWins] = useState(() => Number(localStorage.getItem(HS_KEY) || 0))

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en)

  const resetBall = useCallback((toPlayer: boolean) => {
    ball.current = {
      x: W / 2,
      y: H / 2,
      vx: (toPlayer ? -1 : 1) * 3.2,
      vy: (Math.random() * 2 - 1) * 2.4,
    }
  }, [])

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const accent = cssVar('--accent', '#38bdf8')
    const accent2 = cssVar('--accent2', '#ff6ec7')
    const ink = cssVar('--ink', '#0c0813')

    ctx.fillStyle = ink
    ctx.fillRect(0, 0, W, H)

    // center net
    ctx.strokeStyle = 'rgba(148,163,184,0.2)'
    ctx.setLineDash([6, 10])
    ctx.beginPath()
    ctx.moveTo(W / 2, 0)
    ctx.lineTo(W / 2, H)
    ctx.stroke()
    ctx.setLineDash([])

    // paddles
    ctx.fillStyle = accent
    ctx.fillRect(12, playerY.current, PADDLE_W, PADDLE_H)
    ctx.fillRect(W - 12 - PADDLE_W, cpuY.current, PADDLE_W, PADDLE_H)

    // ball
    ctx.fillStyle = accent2
    ctx.shadowColor = accent2
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(ball.current.x, ball.current.y, BALL_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }, [])

  const finish = useCallback((won: boolean) => {
    setRunning(false)
    setOver(true)
    setWinner(won ? 'you' : 'cpu')
    if (won) {
      setWins((w) => {
        const nw = w + 1
        localStorage.setItem(HS_KEY, String(nw))
        return nw
      })
    }
  }, [])

  const loop = useCallback(() => {
    const b = ball.current

    // player movement (held keys)
    const sp = 5.2
    if (keys.current.has('up')) playerY.current -= sp
    if (keys.current.has('down')) playerY.current += sp
    playerY.current = Math.max(0, Math.min(H - PADDLE_H, playerY.current))

    // cpu follows ball (capped → beatable)
    const target = b.y - PADDLE_H / 2
    const diff = target - cpuY.current
    cpuY.current += Math.max(-3.6, Math.min(3.6, diff))
    cpuY.current = Math.max(0, Math.min(H - PADDLE_H, cpuY.current))

    // ball move
    b.x += b.vx
    b.y += b.vy
    if (b.y < BALL_R) { b.y = BALL_R; b.vy *= -1 }
    if (b.y > H - BALL_R) { b.y = H - BALL_R; b.vy *= -1 }

    // paddle collisions
    const hit = (py: number) => b.y > py - BALL_R && b.y < py + PADDLE_H + BALL_R
    if (b.vx < 0 && b.x - BALL_R < 12 + PADDLE_W && b.x > 12 && hit(playerY.current)) {
      b.x = 12 + PADDLE_W + BALL_R
      b.vx = Math.abs(b.vx) * 1.06
      b.vy += ((b.y - (playerY.current + PADDLE_H / 2)) / (PADDLE_H / 2)) * 2
    }
    if (b.vx > 0 && b.x + BALL_R > W - 12 - PADDLE_W && b.x < W - 12 && hit(cpuY.current)) {
      b.x = W - 12 - PADDLE_W - BALL_R
      b.vx = -Math.abs(b.vx) * 1.06
      b.vy += ((b.y - (cpuY.current + PADDLE_H / 2)) / (PADDLE_H / 2)) * 2
    }

    // scoring
    if (b.x < -BALL_R) {
      setCScore((c) => {
        const nc = c + 1
        if (nc >= WIN) finish(false)
        else resetBall(false)
        return nc
      })
    } else if (b.x > W + BALL_R) {
      setPScore((p) => {
        const np = p + 1
        if (np >= WIN) finish(true)
        else resetBall(true)
        return np
      })
    }

    draw()
    rafRef.current = requestAnimationFrame(loop)
  }, [draw, finish, resetBall])

  useEffect(() => {
    if (!running) return
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, loop])

  const start = useCallback(() => {
    playerY.current = (H - PADDLE_H) / 2
    cpuY.current = (H - PADDLE_H) / 2
    setPScore(0)
    setCScore(0)
    setOver(false)
    setWinner(null)
    resetBall(Math.random() < 0.5)
    setRunning(true)
  }, [resetBall])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (['ArrowUp', 'w', 'z'].includes(e.key)) { keys.current.add('up'); e.preventDefault() }
      if (['ArrowDown', 's'].includes(e.key)) { keys.current.add('down'); e.preventDefault() }
      if (e.key === ' ' && !running) { e.preventDefault(); start() }
    }
    const up = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'z'].includes(e.key)) keys.current.delete('up')
      if (['ArrowDown', 's'].includes(e.key)) keys.current.delete('down')
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [onClose, running, start])

  useEffect(() => { draw() }, [draw])

  const hold = (dir: 'up' | 'down') => ({
    onPointerDown: () => { if (!running && !over) start(); keys.current.add(dir) },
    onPointerUp: () => keys.current.delete(dir),
    onPointerLeave: () => keys.current.delete(dir),
  })

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
            <span className="font-mono text-accent">🏓</span> Pong
          </h2>
          <button onClick={onClose} className="btn-ghost px-2.5 py-1 text-xs">
            ✕ {t('Fermer', 'Close')}
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between font-mono text-sm">
          <span className="text-body">
            {t('Toi', 'You')}: <span className="text-accent">{pScore}</span> · CPU:{' '}
            <span className="text-accent2">{cScore}</span>
          </span>
          <span className="text-muted">
            {t('Victoires', 'Wins')}: <span className="text-accent2">{wins}</span>
          </span>
        </div>

        <div className="relative mx-auto" style={{ width: W, maxWidth: '100%' }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full rounded-lg border border-fg/10"
            style={{ aspectRatio: `${W} / ${H}`, touchAction: 'none' }}
          />
          {(!running || over) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-ink/80 text-center backdrop-blur-sm">
              {over && (
                <p className="font-mono text-sm text-accent2">
                  {winner === 'you' ? t('Gagné ! 🏆', 'You win! 🏆') : t('Perdu…', 'You lose…')}
                </p>
              )}
              <button onClick={start} className="btn-accent">
                {over ? t('Rejouer', 'Play again') : t('Jouer', 'Play')}
              </button>
              <p className="max-w-[16rem] text-xs text-muted">
                {t('Premier à 5. ↑/↓ ou W/S.', 'First to 5. ↑/↓ or W/S.')}
              </p>
            </div>
          )}
        </div>

        {/* touch controls */}
        <div className="mx-auto mt-4 flex w-40 flex-col gap-1.5 sm:hidden">
          <button className="btn-ghost py-2.5" {...hold('up')}>▲</button>
          <button className="btn-ghost py-2.5" {...hold('down')}>▼</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
