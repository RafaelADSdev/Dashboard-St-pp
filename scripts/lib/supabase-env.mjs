import { readFileSync } from 'node:fs'

export function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf8')
    const env = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
    return env
  } catch {
    return {}
  }
}

export function mergeEnv() {
  const rootEnv = loadEnvFile('.env')
  const localEnv = loadEnvFile('.env.local')
  return { ...rootEnv, ...localEnv, ...process.env }
}

export function resolveSupabaseUrl(env = mergeEnv()) {
  return env.NEXT_PUBLIC_SUPABASE_URL ?? env.VITE_SUPABASE_URL
}

export function resolveServiceRoleKey(env = mergeEnv()) {
  return env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY
}

export function requireSupabaseUrl(env = mergeEnv()) {
  const url = resolveSupabaseUrl(env)
  if (!url) {
    console.error('Defina NEXT_PUBLIC_SUPABASE_URL no .env.local ou no ambiente.')
    process.exit(1)
  }
  return url
}

export function requireServiceRoleKey(env = mergeEnv()) {
  const key = resolveServiceRoleKey(env)
  if (!key) {
    console.error(
      'Defina SUPABASE_SERVICE_ROLE_KEY no .env.local (Supabase → Settings → API → service_role).'
    )
    process.exit(1)
  }
  return key
}
