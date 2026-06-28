/** Domínio interno para login por nome de usuário no Supabase Auth. */
export const USERNAME_EMAIL_DOMAIN = 'stupp.dashboard'

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function usernameToEmail(username: string): string {
  const normalized = normalizeUsername(username).replace(/[^a-z0-9._-]/g, '')
  if (!normalized) {
    throw new Error('Nome de usuário inválido')
  }
  return `${normalized}@${USERNAME_EMAIL_DOMAIN}`
}

export function emailToUsername(email: string): string | null {
  const suffix = `@${USERNAME_EMAIL_DOMAIN}`
  if (!email.toLowerCase().endsWith(suffix)) return null
  return email.slice(0, -suffix.length)
}
