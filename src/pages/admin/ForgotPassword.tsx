import { useState } from 'react'
import { confirmReset, requestReset, type ResetChannel } from '../../lib/api'

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [channel, setChannel] = useState<ResetChannel>('email')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { hint } = await requestReset(channel)
      setInfo(hint ?? `Code envoyé par ${channel === 'email' ? 'email' : 'SMS'}.`)
      setStep('confirm')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await confirmReset(code, newPassword)
      setInfo('✓ Mot de passe réinitialisé. Tu peux te connecter.')
      setStep('request')
      setTimeout(onBack, 1200)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-white">Mot de passe oublié</h1>

        {step === 'request' ? (
          <form onSubmit={send} className="space-y-4">
            <div className="space-y-1.5">
              <span className="label">Recevoir un code via</span>
              <div className="inline-flex w-full overflow-hidden rounded-lg border border-white/10 text-sm">
                {(['email', 'sms'] as ResetChannel[]).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setChannel(c)}
                    className={'flex-1 px-3 py-2 uppercase ' + (channel === c ? 'bg-accent text-ink' : 'text-slate-300 hover:bg-white/5')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-emerald-400">{info}</p>}
            <button type="submit" className="btn-accent w-full" disabled={loading}>
              {loading ? '…' : 'Envoyer le code'}
            </button>
          </form>
        ) : (
          <form onSubmit={confirm} className="space-y-4">
            {info && <p className="text-sm text-emerald-400">{info}</p>}
            <label className="block space-y-1.5">
              <span className="label">Code reçu</span>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            </label>
            <label className="block space-y-1.5">
              <span className="label">Nouveau mot de passe</span>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn-accent w-full" disabled={loading}>
              {loading ? '…' : 'Réinitialiser'}
            </button>
          </form>
        )}

        <button onClick={onBack} className="w-full text-xs text-slate-500 hover:text-slate-300">
          ← Retour à la connexion
        </button>
      </div>
    </div>
  )
}
