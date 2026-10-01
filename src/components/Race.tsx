import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lang } from '../lib/types'

/* ---------------- pseudo-3D racer (Mode-7 / OutRun style) ---------------- */

const W = 420
const H = 300
const SEG = 200 // segment length (world z)
const RUMBLE = 4 // segments per color band
const ROAD_W = 1400
const DRAW = 160 // segments drawn ahead
const CAM_H = 1000
const FOV = 100
const CAM_DEPTH = 1 / Math.tan((FOV / 2) * (Math.PI / 180))
const CENTRIF = 0.32
const TOTAL_LAPS = 3
const HS_KEY = 'cv_race_besttime'

type Pt = {
  world: { x: number; y: number; z: number }
  camera: { x: number; y: number; z: number }
  screen: { x: number; y: number; w: number; scale: number }
}
type Seg = { index: number; curve: number; p1: Pt; p2: Pt; color: 0 | 1; clip?: number }
type Opp = { z: number; offset: number; speed: number; color: string }

const mkPt = (z: number, y: number): Pt => ({
  world: { x: 0, y, z },
  camera: { x: 0, y: 0, z: 0 },
  screen: { x: 0, y: 0, w: 0, scale: 0 },
})

function buildTrack(): Seg[] {
  const N = 620
  const segs: Seg[] = []
  const curveAt = (i: number) => {
    if (i > 80 && i < 160) return 2.2
    if (i > 200 && i < 260) return -3.4
    if (i > 300 && i < 340) return 4
    if (i > 380 && i < 440) return -2
    if (i > 480 && i < 520) return 3
    if (i > 540 && i < 600) return -2.6
    return 0
  }
  const yAt = (i: number) => Math.sin(i * 0.045) * 1300 + Math.sin(i * 0.11) * 600
  for (let i = 0; i < N; i++) {
    segs.push({
      index: i,
      curve: curveAt(i),
      p1: mkPt(i * SEG, yAt(i)),
      p2: mkPt((i + 1) * SEG, yAt(i + 1)),
      color: (Math.floor(i / RUMBLE) % 2) as 0 | 1,
    })
  }
  return segs
}

function project(p: Pt, camX: number, camY: number, camZ: number) {
  p.camera.x = p.world.x - camX
  p.camera.y = p.world.y - camY
  p.camera.z = p.world.z - camZ
  p.screen.scale = CAM_DEPTH / p.camera.z
  p.screen.x = Math.round(W / 2 + (p.screen.scale * p.camera.x * W) / 2)
  p.screen.y = Math.round(H / 2 - (p.screen.scale * p.camera.y * H) / 2)
  p.screen.w = Math.round((p.screen.scale * ROAD_W * W) / 2)
}

export default function Race({ onClose, lang }: { onClose: () => void; lang: Lang }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const segs = useRef<Seg[]>(buildTrack())
  const trackLen = segs.current.length * SEG

  const position = useRef(0)
  const playerX = useRef(0) // -1..1 road units (can go offroad to ±2)
  const speed = useRef(0)
  const keys = useRef<Set<string>>(new Set())
  const raf = useRef<number>(0)
  const last = useRef<number>(0)
  const lapRef = useRef(1)
  const timeRef = useRef(0)
  const opps = useRef<Opp[]>([])

  const MAXSPEED = SEG * 58
  const ACCEL = MAXSPEED / 4
  const BRAKE = -MAXSPEED
  const DECEL = -MAXSPEED / 4
  const OFFDECEL = -MAXSPEED / 1.4
  const OFFLIMIT = MAXSPEED / 4

  const [running, setRunning] = useState(false)
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const [lap, setLap] = useState(1)
  const [spd, setSpd] = useState(0)
  const [time, setTime] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem(HS_KEY) || 0))

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const findSeg = (z: number) => segs.current[Math.floor(z / SEG) % segs.current.length]

  /** Draw a kart from behind, anchored so wheels sit at bottomY. */
  const drawKart = useCallback(
    (ctx: CanvasRenderingContext2D, cx: number, bottomY: number, width: number, color: string, lean = 0, outline = false) => {
      const w = Math.max(9, width)
      const h = w * 0.92
      ctx.save()
      ctx.translate(cx, bottomY)
      ctx.rotate(lean)
      // ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.beginPath()
      ctx.ellipse(0, -h * 0.06, w * 0.62, h * 0.14, 0, 0, Math.PI * 2)
      ctx.fill()
      // rear wheels
      ctx.fillStyle = '#0c0c12'
      round(ctx, -w / 2 - w * 0.06, -h * 0.52, w * 0.2, h * 0.5, w * 0.05); ctx.fill()
      round(ctx, w / 2 - w * 0.14, -h * 0.52, w * 0.2, h * 0.5, w * 0.05); ctx.fill()
      // rear wing
      ctx.fillStyle = shade(color, -0.25)
      round(ctx, -w * 0.52, -h * 1.02, w * 1.04, h * 0.16, w * 0.05); ctx.fill()
      // body
      const grad = ctx.createLinearGradient(0, -h, 0, 0)
      grad.addColorStop(0, shade(color, 0.25))
      grad.addColorStop(1, shade(color, -0.2))
      ctx.fillStyle = grad
      round(ctx, -w * 0.42, -h * 0.9, w * 0.84, h * 0.82, w * 0.22); ctx.fill()
      if (outline) {
        ctx.lineWidth = Math.max(1, w * 0.06)
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.stroke()
      }
      // cockpit
      ctx.fillStyle = 'rgba(8,8,16,0.72)'
      round(ctx, -w * 0.22, -h * 0.74, w * 0.44, h * 0.4, w * 0.1); ctx.fill()
      ctx.restore()
    },
    [],
  )

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const accent = cssVar('--accent', '#38bdf8')
    const accent2 = cssVar('--accent2', '#ff6ec7')
    const horizon = H * 0.56

    // --- synthwave night sky ---
    const sky = ctx.createLinearGradient(0, 0, 0, horizon)
    sky.addColorStop(0, '#070512')
    sky.addColorStop(0.55, shade(accent2, -0.58))
    sky.addColorStop(1, shade(accent2, -0.18))
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, horizon)
    // stars (deterministic)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    for (let i = 0; i < 46; i++) {
      const sx = (i * 73) % W
      const sy = (i * 131) % Math.floor(horizon * 0.72)
      ctx.fillRect(sx, sy, 1.4, 1.4)
    }
    // synthwave sun with scan lines
    const sunR = W * 0.15
    const sunY = horizon - sunR * 0.5
    ctx.save()
    ctx.beginPath()
    ctx.arc(W / 2, sunY, sunR, 0, Math.PI * 2)
    ctx.clip()
    const sun = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR)
    sun.addColorStop(0, '#ffe36b')
    sun.addColorStop(0.55, accent2)
    sun.addColorStop(1, shade(accent2, -0.1))
    ctx.fillStyle = sun
    ctx.fillRect(W / 2 - sunR, sunY - sunR, sunR * 2, sunR * 2)
    ctx.fillStyle = '#070512'
    for (let i = 0; i < 7; i++) ctx.fillRect(W / 2 - sunR, sunY + 1 + i * 5, sunR * 2, 1.6 + i * 0.7)
    ctx.restore()
    // distant neon skyline
    drawSkyline(ctx, horizon, accent)
    // dark city ground
    ctx.fillStyle = '#060410'
    ctx.fillRect(0, horizon - 1, W, H - horizon + 1)

    const base = findSeg(position.current)
    const basePct = (position.current % SEG) / SEG
    const playerHill = base.p1.world.y + (base.p2.world.y - base.p1.world.y) * basePct
    const camH = CAM_H + playerHill
    const camX = playerX.current * ROAD_W

    let x = 0
    let dx = -(base.curve * basePct)
    let maxy = H
    const N = segs.current.length

    for (let n = 0; n < DRAW; n++) {
      const seg = segs.current[(base.index + n) % N]
      const looped = seg.index < base.index
      const camZ = position.current - (looped ? trackLen : 0)

      seg.clip = maxy
      project(seg.p1, camX - x, camH, camZ)
      project(seg.p2, camX - x - dx, camH, camZ)
      x += dx
      dx += seg.curve

      if (seg.p1.camera.z <= CAM_DEPTH || seg.p2.screen.y >= maxy || seg.p2.screen.y >= seg.p1.screen.y)
        continue
      renderSeg(ctx, seg, accent, accent2, n)
      maxy = seg.p2.screen.y
    }

    // rivals far → near, clipped by hills (segment.clip)
    for (let n = DRAW - 1; n > 0; n--) {
      const seg = segs.current[(base.index + n) % N]
      if (seg.p1.camera.z <= CAM_DEPTH) continue
      for (const o of opps.current) {
        if (findSeg(o.z).index !== seg.index) continue
        const halfW = seg.p1.screen.w
        const sx = seg.p1.screen.x + o.offset * halfW
        const sy = seg.p1.screen.y
        const kw = Math.max(10, halfW * 0.52)
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, W, seg.clip ?? H)
        ctx.clip()
        drawKart(ctx, sx, sy, kw, o.color, 0, true)
        ctx.restore()
      }
    }

    // player kart (always bottom-centre, on top)
    const lean = (keys.current.has('left') ? -0.14 : 0) + (keys.current.has('right') ? 0.14 : 0)
    drawKart(ctx, W / 2 + playerX.current * 8, H - 14, 58, accent, lean, false)
  }, [drawKart, trackLen])

  // camera-relative z of an absolute track z
  function rel(z: number) {
    let d = z - position.current
    while (d < 0) d += trackLen
    return d
  }

  function renderSeg(ctx: CanvasRenderingContext2D, seg: Seg, accent: string, accent2: string, n: number) {
    const p1 = seg.p1.screen
    const p2 = seg.p2.screen
    const dark = seg.color === 0
    const side = dark ? '#09081a' : '#0c0a22'
    const road = dark ? '#14141f' : '#101019'
    const rumble = dark ? accent : accent2
    const finish = seg.index < 8
    const near = n < 26

    // city floor band
    ctx.fillStyle = side
    ctx.fillRect(0, p2.y, W, p1.y - p2.y)
    // Tron floor grid line on the sides
    if (dark) {
      ctx.fillStyle = 'rgba(120,180,255,0.10)'
      ctx.fillRect(0, p1.y, p1.x - p1.w, 1.4)
      ctx.fillRect(p1.x + p1.w, p1.y, W, 1.4)
    }
    // road
    quad(ctx, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y,
      finish ? (seg.index % 2 ? '#e5e7eb' : '#161622') : road)
    // neon rumble strips (glow on near segments)
    const r1 = p1.w * 0.13, r2 = p2.w * 0.13
    if (near) { ctx.save(); ctx.shadowColor = rumble; ctx.shadowBlur = 8 }
    quad(ctx, p1.x - p1.w, p1.y, p1.x - p1.w + r1, p1.y, p2.x - p2.w + r2, p2.y, p2.x - p2.w, p2.y, rumble)
    quad(ctx, p1.x + p1.w - r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w - r2, p2.y, rumble)
    if (near) ctx.restore()
    // neon centre lanes on light segments
    if (!dark && !finish) {
      const lw1 = p1.w * 0.022, lw2 = p2.w * 0.022
      for (const f of [-1 / 3, 1 / 3]) {
        const l1 = p1.x + p1.w * f, l2 = p2.x + p2.w * f
        quad(ctx, l1 - lw1, p1.y, l1 + lw1, p1.y, l2 + lw2, p2.y, l2 - lw2, p2.y, accent2)
      }
    }
    // glowing neon pylons lining the track
    if (seg.index % 10 === 0 && n < 130) {
      const postH = p1.w * 0.95
      const pw = Math.max(1, p1.w * 0.05)
      const col = (seg.index / 10) % 2 ? accent : accent2
      ctx.save()
      ctx.shadowColor = col
      ctx.shadowBlur = 10
      ctx.fillStyle = col
      ctx.fillRect(p1.x - p1.w - pw * 1.4, p1.y - postH, pw, postH)
      ctx.fillRect(p1.x + p1.w + pw * 0.4, p1.y - postH, pw, postH)
      ctx.restore()
    }
    // depth fog → fade distant segments into the night
    const fog = Math.min(0.85, Math.pow(n / DRAW, 2) * 1.5)
    if (fog > 0.02) {
      ctx.globalAlpha = fog
      ctx.fillStyle = '#0a0618'
      ctx.fillRect(0, p2.y, W, p1.y - p2.y + 1)
      ctx.globalAlpha = 1
    }
  }

  const finish = useCallback((didWin: boolean) => {
    setRunning(false)
    setOver(true)
    setWon(didWin)
    if (didWin) {
      const tm = Math.round(timeRef.current * 10) / 10
      setBest((b) => {
        const nb = b === 0 ? tm : Math.min(b, tm)
        localStorage.setItem(HS_KEY, String(nb))
        return nb
      })
    }
  }, [])

  const loop = useCallback(
    (ts: number) => {
      if (!last.current) last.current = ts
      const dt = Math.min(0.05, (ts - last.current) / 1000)
      last.current = ts

      const seg = findSeg(position.current + CAM_H * CAM_DEPTH)
      const spct = speed.current / MAXSPEED
      const steer = dt * 2.4 * spct
      if (keys.current.has('left')) playerX.current -= steer
      if (keys.current.has('right')) playerX.current += steer
      playerX.current -= steer * spct * seg.curve * CENTRIF

      if (keys.current.has('up')) speed.current += ACCEL * dt
      else if (keys.current.has('down')) speed.current += BRAKE * dt
      else speed.current += DECEL * dt

      if ((playerX.current < -1 || playerX.current > 1) && speed.current > OFFLIMIT)
        speed.current += OFFDECEL * dt

      playerX.current = Math.max(-2, Math.min(2, playerX.current))
      speed.current = Math.max(0, Math.min(MAXSPEED, speed.current))

      // opponents move + collision
      for (const o of opps.current) {
        o.z = (o.z + o.speed * dt) % trackLen
        const d = rel(o.z)
        if (d < SEG * 1.4 && d > -SEG && Math.abs(playerX.current - o.offset) < 0.55) {
          speed.current *= 0.45
          playerX.current += playerX.current > o.offset ? 0.08 : -0.08
        }
      }

      const prev = position.current
      position.current = (position.current + speed.current * dt) % trackLen
      if (position.current < prev) {
        lapRef.current += 1
        setLap(lapRef.current)
        if (lapRef.current > TOTAL_LAPS) {
          draw()
          finish(true)
          return
        }
      }

      timeRef.current += dt
      setTime(Math.round(timeRef.current * 10) / 10)
      setSpd(Math.round((speed.current / MAXSPEED) * 200))

      draw()
      raf.current = requestAnimationFrame(loop)
    },
    [draw, finish, trackLen, ACCEL, BRAKE, DECEL, MAXSPEED, OFFDECEL, OFFLIMIT],
  )

  useEffect(() => {
    if (!running) return
    last.current = 0
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [running, loop])

  const start = useCallback(() => {
    position.current = 0
    playerX.current = 0
    speed.current = 0
    lapRef.current = 1
    timeRef.current = 0
    setLap(1)
    setTime(0)
    setSpd(0)
    opps.current = [
      { z: SEG * 10, offset: -0.5, speed: MAXSPEED * 0.72, color: '#f59e0b' },
      { z: SEG * 26, offset: 0.45, speed: MAXSPEED * 0.68, color: '#22c55e' },
      { z: SEG * 48, offset: -0.2, speed: MAXSPEED * 0.75, color: '#e11d48' },
      { z: SEG * 80, offset: 0.55, speed: MAXSPEED * 0.7, color: '#a855f7' },
    ]
    setOver(false)
    setWon(false)
    setRunning(true)
  }, [MAXSPEED])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a', 'q'].includes(k)) { keys.current.add('left'); e.preventDefault() }
      if (['arrowright', 'd'].includes(k)) { keys.current.add('right'); e.preventDefault() }
      if (['arrowup', 'w', 'z'].includes(k)) { keys.current.add('up'); e.preventDefault() }
      if (['arrowdown', 's'].includes(k)) { keys.current.add('down'); e.preventDefault() }
      if (k === ' ' && !running) { e.preventDefault(); start() }
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a', 'q'].includes(k)) keys.current.delete('left')
      if (['arrowright', 'd'].includes(k)) keys.current.delete('right')
      if (['arrowup', 'w', 'z'].includes(k)) keys.current.delete('up')
      if (['arrowdown', 's'].includes(k)) keys.current.delete('down')
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [onClose, running, start])

  useEffect(() => { draw() }, [draw])

  const hold = (dir: string) => ({
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
        className="card w-full max-w-lg"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-strong">
            <span className="font-mono text-accent">🏎️</span> {t('Grand Prix', 'Grand Prix')}
          </h2>
          <button onClick={onClose} className="btn-ghost px-2.5 py-1 text-xs">
            ✕ {t('Fermer', 'Close')}
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between font-mono text-sm">
          <span className="text-body">
            {t('Tour', 'Lap')} <span className="text-accent">{Math.min(lap, TOTAL_LAPS)}</span>/{TOTAL_LAPS}
          </span>
          <span className="text-body">{spd} km/h</span>
          <span className="text-muted">
            ⏱ {time}s {best > 0 && <span className="text-accent2">· {best}s</span>}
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
                  {won ? `🏆 ${t('Course finie', 'Race done')} — ${time}s` : t('💥 Abandon', '💥 Retired')}
                </p>
              )}
              <button onClick={start} className="btn-accent">
                {over ? t('Rejouer', 'Play again') : t('Démarrer', 'Start')}
              </button>
              <p className="max-w-[18rem] text-xs text-muted">
                {t('←/→ diriger · ↑ accélérer · ↓ freiner. 3 tours, double les rivaux !',
                   '←/→ steer · ↑ gas · ↓ brake. 3 laps, pass your rivals!')}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between sm:hidden">
          <div className="flex gap-1.5">
            <button className="btn-ghost w-16 py-3" {...hold('left')}>◀</button>
            <button className="btn-ghost w-16 py-3" {...hold('right')}>▶</button>
          </div>
          <div className="flex gap-1.5">
            <button className="btn-ghost w-16 py-3" {...hold('up')}>⤊</button>
            <button className="btn-ghost w-16 py-3" {...hold('down')}>⤋</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------------- helpers ---------------- */

function cssVar(name: string, fb: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v ? `rgb(${v})` : fb
}

/** Distant neon city skyline silhouette with lit windows. */
function drawSkyline(ctx: CanvasRenderingContext2D, base: number, neon: string) {
  let x = 0
  let i = 0
  while (x < W) {
    const w = 14 + ((i * 37) % 24)
    const h = 16 + ((i * 53) % 52)
    ctx.fillStyle = '#0a0820'
    ctx.fillRect(x, base - h, w, h)
    ctx.globalAlpha = 0.6
    ctx.fillStyle = neon
    ctx.fillRect(x, base - h, w, 1.5)
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(255,236,120,0.65)'
    for (let wy = base - h + 4; wy < base - 3; wy += 5)
      for (let wx = x + 3; wx < x + w - 2; wx += 5)
        if ((wx * 7 + wy * 13 + i) % 3 === 0) ctx.fillRect(wx, wy, 1.4, 2)
    x += w + 3
    i++
  }
}

function quad(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineTo(x3, y3)
  ctx.lineTo(x4, y4)
  ctx.closePath()
  ctx.fill()
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** darken/lighten an rgb() or #hex color by pct (-1..1). */
function shade(c: string, pct: number) {
  let r: number, g: number, b: number
  if (c[0] === '#') {
    const h = c.length === 4
      ? c.slice(1).split('').map((d) => d + d).join('')
      : c.slice(1)
    r = parseInt(h.slice(0, 2), 16)
    g = parseInt(h.slice(2, 4), 16)
    b = parseInt(h.slice(4, 6), 16)
  } else {
    const m = c.match(/\d+/g)
    if (!m) return c
    ;[r, g, b] = m.map(Number)
  }
  const f = pct < 0 ? 0 : 255
  const p = Math.abs(pct)
  return `rgb(${Math.round(r + (f - r) * p)}, ${Math.round(g + (f - g) * p)}, ${Math.round(b + (f - b) * p)})`
}
