import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_PROJECT_REF = 'vhtztzilrrlbflicmeft'
const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`
const USERNAME_EMAIL_DOMAIN = 'stupp.dashboard'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

function usernameToEmail(username) {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
  if (!normalized) throw new Error('Nome de usuário inválido')
  return `${normalized}@${USERNAME_EMAIL_DOMAIN}`
}

function loadEnvFile(path) {
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

async function ensureAdminUser(supabase) {
  const email = usernameToEmail(ADMIN_USERNAME)

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })

  if (listError) throw listError

  const found = existing.users.find(
    (user) =>
      user.email?.toLowerCase() === email ||
      user.user_metadata?.username === ADMIN_USERNAME
  )

  if (found) {
    const { data, error } = await supabase.auth.admin.updateUserById(found.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: { username: ADMIN_USERNAME },
    })
    if (error) throw error
    return { action: 'updated', userId: data.user.id }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { role: 'admin' },
    user_metadata: { username: ADMIN_USERNAME },
  })

  if (error) throw error
  return { action: 'created', userId: data.user.id }
}

async function ensureAdminProfile(supabase, userId) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      username: ADMIN_USERNAME,
      role: 'admin',
    },
    { onConflict: 'id' }
  )

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    throw error
  }
}

async function main() {
  const localEnv = loadEnvFile('.env.local')
  const rootEnv = loadEnvFile('.env')

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    localEnv.NEXT_PUBLIC_SUPABASE_URL ??
    localEnv.VITE_SUPABASE_URL ??
    rootEnv.NEXT_PUBLIC_SUPABASE_URL ??
    rootEnv.VITE_SUPABASE_URL ??
    DEFAULT_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    localEnv.SUPABASE_SERVICE_ROLE_KEY ??
    rootEnv.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    console.error(
      'Defina SUPABASE_SERVICE_ROLE_KEY no .env.local (Supabase → Settings → API → service_role).'
    )
    process.exit(1)
  }

  console.log(`Projeto: ${SUPABASE_PROJECT_REF}`)
  console.log(`URL: ${url}`)

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const result = await ensureAdminUser(supabase)
  await ensureAdminProfile(supabase, result.userId)

  console.log(`Admin ${result.action}: usuário "${ADMIN_USERNAME}" / senha "${ADMIN_PASSWORD}"`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
