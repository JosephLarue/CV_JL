import type { Content } from './types'

const TOKEN_KEY = 'cv_admin_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function fetchContent(): Promise<Content> {
  const res = await fetch('/api/content')
  if (!res.ok) throw new Error('Impossible de charger le contenu')
  return res.json()
}

export async function login(password: string): Promise<string> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('Mot de passe incorrect')
  const data = (await res.json()) as { token: string }
  return data.token
}

export type ResetChannel = 'email' | 'sms'

export async function requestReset(channel: ResetChannel): Promise<{ hint?: string }> {
  const res = await fetch('/api/reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
  })
  if (!res.ok) throw new Error('Impossible d’envoyer le code')
  return res.json()
}

export async function confirmReset(code: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, newPassword }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? 'Code invalide ou expiré')
  }
}

export async function saveContent(content: Content): Promise<void> {
  const token = getToken()
  const res = await fetch('/api/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
    },
    body: JSON.stringify(content),
  })
  if (res.status === 401) {
    clearToken()
    throw new Error('Session expirée, reconnecte-toi')
  }
  if (!res.ok) throw new Error('Échec de la sauvegarde')
}
