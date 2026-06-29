/** Projeto Supabase Stüpp Dashboard */
export const SUPABASE_PROJECT_REF = 'vhtztzilrrlbflicmeft'

export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`

function readSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    DEFAULT_SUPABASE_URL
  )
}

function readSupabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY
  )
}

export function isSupabaseAuthEnabled(): boolean {
  return Boolean(readSupabaseUrl() && readSupabaseKey())
}

/** Em produção exige login mesmo se variáveis faltarem no build (fail-closed). */
export function shouldEnforceAuth(): boolean {
  const disabled =
    process.env.AUTH_DISABLED === 'true' || process.env.AUTH_DISABLED === '1'
  if (disabled) return false
  return process.env.NODE_ENV === 'production' || isSupabaseAuthEnabled()
}

export function getSupabaseUrl(): string {
  return readSupabaseUrl()
}

export function getSupabasePublishableKey(): string {
  const key = readSupabaseKey()
  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou VITE_SUPABASE_ANON_KEY não configurado'
    )
  }
  return key
}
