import { useState } from 'react'
import { login, setToken } from '../../lib/api'
import ForgotPassword from './ForgotPassword'

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgot, setForgot] = useState(false)

  if (forgot) return <ForgotPassword onBack={() => setForgot(false)} />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const token = await login(password)
      setToken(token)
      onSuccess()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-xl font-bold text-strong">Backoffice</h1>
          <p className="mt-1 text-sm text-muted">Connexion requise</p>
        </div>
        <div className="space-y-1.5">
          <label className="label" htmlFor="pwd">
            Mot de passe
          </label>
          <input
            id="pwd"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-accent w-full" disabled={loading}>
          {loading ? '…' : 'Se connecter'}
        </button>
        <button
          type="button"
          onClick={() => setForgot(true)}
          className="w-full text-xs text-muted hover:text-body"
        >
          Mot de passe oublié ?
        </button>
      </form>
    </div>
  )
}
