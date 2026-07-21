import { createClient } from '@supabase/supabase-js'
import {
  mergeEnv,
  requireServiceRoleKey,
  requireSupabaseUrl,
} from './lib/supabase-env.mjs'

const USERNAME_EMAIL_DOMAIN = 'stupp.dashboard'

function usernameToEmail(username) {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
  if (!normalized) throw new Error('Nome de usuário inválido')
  return `${normalized}@${USERNAME_EMAIL_DOMAIN}`
}

function parseArgs(argv) {
  const force = argv.includes('--force')
  const positional = argv.filter((arg) => !arg.startsWith('--'))
  return {
    force,
    username: positional[0]?.trim().toLowerCase(),
    password: positional[1],
    role: positional[2]?.trim().toLowerCase() || 'admin',
  }
}

async function ensureUser(supabase, { username, password, role }, force) {
  const email = usernameToEmail(username)
  const isAdmin = role === 'admin'

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })

  if (listError) throw listError

  const found = existing.users.find(
    (user) =>
      user.email?.toLowerCase() === email ||
      user.user_metadata?.username === username
  )

  const appMetadata = isAdmin
    ? { role: 'admin', visao: 'admin', esteira: 'TODAS', diretoria_ids: [], equipe_id: null, permissions: [] }
    : { role: 'user' }

  if (found) {
    const updates = {
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: { username },
    }

    if (force) {
      updates.password = password
    }

    const { data, error } = await supabase.auth.admin.updateUserById(found.id, updates)
    if (error) throw error
    return { action: force ? 'updated' : 'exists', userId: data.user.id }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
    user_metadata: { username },
  })

  if (error) throw error
  return { action: 'created', userId: data.user.id }
}

async function ensureProfile(supabase, userId, username, role) {
  const isAdmin = role === 'admin'
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      username,
      role: isAdmin ? 'admin' : 'user',
      visao: isAdmin ? 'admin' : 'lider',
      esteira: 'TODAS',
      diretoria_ids: [],
      equipe_id: null,
      permissions: [],
    },
    { onConflict: 'id' }
  )

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    throw error
  }
}

async function main() {
  const { force, username, password, role } = parseArgs(process.argv.slice(2))

  if (!username || !password) {
    console.error('Uso: node scripts/seed-user.mjs <usuario> <senha> [admin|user] [--force]')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('A senha deve ter no mínimo 8 caracteres.')
    process.exit(1)
  }

  const env = mergeEnv()
  const url = requireSupabaseUrl(env)
  const serviceRoleKey = requireServiceRoleKey(env)

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const result = await ensureUser(supabase, { username, password, role }, force)
  await ensureProfile(supabase, result.userId, username, role)

  if (result.action === 'exists') {
    console.log(
      `Usuário já existe: "${username}" (${role}) — senha mantida. Use --force para redefinir.`
    )
    return
  }

  console.log(`Usuário ${result.action}: "${username}" (${role})`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
