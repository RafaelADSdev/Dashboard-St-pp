import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from './config'

function readServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurado no servidor.'
    )
  }
  return key
}

export function createAdminClient() {
  return createClient(getSupabaseUrl(), readServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
