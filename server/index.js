import crypto from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// Load committed (transcrypt-decrypted) .env first, then let .env.local override.
dotenv.config({ path: path.join(ROOT, '.env') })
dotenv.config({ path: path.join(ROOT, '.env.local'), override: true })

const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

const DATA_DIR = path.join(ROOT, 'data')
const CONTENT_FILE = path.join(DATA_DIR, 'content.json')
const AUTH_FILE = path.join(DATA_DIR, 'auth.json') // holds password after a reset (gitignored)

const app = express()
app.use(express.json({ limit: '2mb' }))

/* ----------------------------- auth helpers ----------------------------- */

const validTokens = new Set()

/** Current password: data/auth.json overrides env ADMIN_PASSWORD. */
function currentPassword() {
  try {
    const { password } = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'))
    if (password) return password
  } catch {
    /* no override yet */
  }
  return process.env.ADMIN_PASSWORD || 'admin'
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token || !validTokens.has(token)) {
    return res.status(401).json({ error: 'Non autorisé' })
  }
  next()
}

/* --------------------------- atomic JSON write -------------------------- */

async function writeJsonAtomic(file, data) {
  await fsp.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${crypto.randomBytes(6).toString('hex')}.tmp`
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fsp.rename(tmp, file)
}

/* ------------------------------- content ------------------------------- */

app.get('/api/content', async (_req, res) => {
  try {
    const raw = await fsp.readFile(CONTENT_FILE, 'utf8')
    res.type('application/json').send(raw)
  } catch {
    res.status(500).json({ error: 'Contenu introuvable' })
  }
})

app.post('/api/content', requireAuth, async (req, res) => {
  const body = req.body
  if (!body || !Array.isArray(body.sections) || !body.settings) {
    return res.status(400).json({ error: 'Format invalide' })
  }
  try {
    await writeJsonAtomic(CONTENT_FILE, body)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Échec de l’écriture' })
  }
})

/* -------------------------------- login -------------------------------- */

app.post('/api/login', (req, res) => {
  const { password } = req.body || {}
  if (typeof password !== 'string' || password !== currentPassword()) {
    return res.status(401).json({ error: 'Mot de passe incorrect' })
  }
  const token = crypto.randomBytes(24).toString('hex')
  validTokens.add(token)
  res.json({ token })
})

/* -------------------------- password reset flow ------------------------- */

let resetEntry = null // { code, expires }

function genCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

async function sendEmail(code) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL } = process.env
  if (!SMTP_HOST || !ADMIN_EMAIL) return false
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  })
  await transporter.sendMail({
    from: SMTP_USER || `cv@${SMTP_HOST}`,
    to: ADMIN_EMAIL,
    subject: 'Code de réinitialisation — Backoffice CV',
    text: `Ton code de réinitialisation est : ${code}\nValable 10 minutes.`,
  })
  return true
}

async function sendSms(code) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, ADMIN_PHONE } = process.env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM || !ADMIN_PHONE) return false
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: ADMIN_PHONE,
        From: TWILIO_FROM,
        Body: `Code de réinitialisation CV : ${code} (valable 10 min)`,
      }),
    },
  )
  if (!resp.ok) throw new Error('Twilio error')
  return true
}

app.post('/api/reset/request', async (req, res) => {
  const { channel } = req.body || {}
  if (channel !== 'email' && channel !== 'sms') {
    return res.status(400).json({ error: 'Canal invalide' })
  }
  const code = genCode()
  resetEntry = { code, expires: Date.now() + 10 * 60 * 1000 }
  try {
    const sent = channel === 'email' ? await sendEmail(code) : await sendSms(code)
    if (!sent) {
      // Provider not configured — dev fallback: log the code, expose it only outside prod.
      console.log(`[reset] Code (${channel}) : ${code}`)
      return res.json({
        hint: IS_PROD
          ? `Canal ${channel} non configuré sur le serveur.`
          : `Canal non configuré — code dev : ${code}`,
      })
    }
    res.json({ hint: `Code envoyé via ${channel}.` })
  } catch (e) {
    console.error('[reset] envoi échoué', e)
    res.status(500).json({ error: 'Envoi du code impossible' })
  }
})

app.post('/api/reset/confirm', async (req, res) => {
  const { code, newPassword } = req.body || {}
  if (!resetEntry || Date.now() > resetEntry.expires) {
    return res.status(400).json({ error: 'Code expiré, redemande un code' })
  }
  if (code !== resetEntry.code) {
    return res.status(400).json({ error: 'Code invalide' })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (min. 6)' })
  }
  try {
    await writeJsonAtomic(AUTH_FILE, { password: newPassword })
    resetEntry = null
    validTokens.clear() // force re-login everywhere
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Échec de la réinitialisation' })
  }
})

/* --------------------------- static (prod) ----------------------------- */

if (IS_PROD) {
  const dist = path.join(ROOT, 'dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`API CV sur http://localhost:${PORT} (${IS_PROD ? 'prod' : 'dev'})`)
})
