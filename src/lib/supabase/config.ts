const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY

export function isSupabaseAuthEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
}

export function getSupabaseUrl(): string {
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou VITE_SUPABASE_URL não configurado')
  }
  return SUPABASE_URL
}

export function getSupabasePublishableKey(): string {
  if (!SUPABASE_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou VITE_SUPABASE_ANON_KEY não configurado'
    )
  }
  return SUPABASE_KEY
}

/** Projeto Supabase Stüpp Dashboard */
export const SUPABASE_PROJECT_REF = 'vhtztzilrrlbflicmeft'

export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`
