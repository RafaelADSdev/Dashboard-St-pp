import { createClient } from '@supabase/supabase-js'
import {
  mergeEnv,
  requireServiceRoleKey,
  requireSupabaseUrl,
} from './lib/supabase-env.mjs'

const USERNAME_EMAIL_DOMAIN = 'stupp.dashboard'
const ADMIN_USERNAME = 'admin'

function usernameToEmail(username) {
  const normalized = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
  if (!normalized) throw new Error('Nome de usuário inválido')
  return `${normalized}@${USERNAME_EMAIL_DOMAIN}`
}

function parseArgs(argv) {
  const force = argv.includes('--force')
  const password = argv.find((arg) => !arg.startsWith('--'))
  return { force, password }
}

function requireAdminPassword(env, argvPassword) {
  const password = env.SEED_ADMIN_PASSWORD ?? argvPassword
  if (!password) {
    console.error(
      'Defina SEED_ADMIN_PASSWORD no ambiente ou passe a senha como argumento: npm run seed:admin -- "sua-senha"'
    )
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('A senha deve ter no mínimo 8 caracteres.')
    process.exit(1)
  }
  return password
}

async function ensureAdminUser(supabase, password, force) {
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
    const updates = {
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: { username: ADMIN_USERNAME },
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
      visao: 'admin',
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
  const env = mergeEnv()
  const { force, password: argvPassword } = parseArgs(process.argv.slice(2))
  const password = requireAdminPassword(env, argvPassword)
  const url = requireSupabaseUrl(env)
  const serviceRoleKey = requireServiceRoleKey(env)

  console.log(`URL: ${url}`)

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const result = await ensureAdminUser(supabase, password, force)
  await ensureAdminProfile(supabase, result.userId)

  if (result.action === 'exists') {
    console.log(
      `Admin já existe: usuário "${ADMIN_USERNAME}" (senha mantida). Use --force para redefinir a senha.`
    )
    return
  }

  console.log(`Admin ${result.action}: usuário "${ADMIN_USERNAME}"`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
