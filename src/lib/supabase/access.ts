import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getErrorMessage } from '@/lib/errors'
import type { UserProfile, UserPermission } from '@/types/access'
import { parsePermissions } from '@/types/access'
import { emailToUsername, usernameToEmail } from '@/lib/supabase/username'
import { hasPermission, isAdminProfile } from '@/lib/userPermissions'

export function isAdminRole(role: string | undefined | null): boolean {
  return role === 'admin'
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role, visao, esteira, diretoria_ids, equipe_id, permissions, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) {
    const role = (user.app_metadata?.role as string | undefined) ?? 'user'
    const username =
      (user.user_metadata?.username as string | undefined) ??
      emailToUsername(user.email ?? '') ??
      'usuario'

    return {
      id: user.id,
      username,
      role: role === 'admin' ? 'admin' : 'user',
      visao: role === 'admin' ? 'admin' : 'lider',
      esteira: 'TODAS',
      diretoria_ids: [],
      equipe_id: null,
      permissions: [],
      created_at: user.created_at,
    }
  }

  return data as UserProfile
}

export async function requireAdminUser() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Não autenticado.', status: 401 as const, user: null }
  }

  const role = user.app_metadata?.role as string | undefined
  if (!isAdminRole(role)) {
    return { error: 'Acesso restrito a administradores.', status: 403 as const, user: null }
  }

  return { error: null, status: 200 as const, user }
}

export async function requireUserPermission(permission: UserPermission) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Não autenticado.', status: 401 as const, user: null, profile: null }
  }

  const profile = await getCurrentUserProfile()
  if (!hasPermission(profile, permission)) {
    return {
      error: 'Você não tem permissão para executar esta ação.',
      status: 403 as const,
      user: null,
      profile: null,
    }
  }

  return { error: null, status: 200 as const, user, profile }
}

export { hasPermission, isAdminProfile }

export function resolveAccessUsername(input: string): { email: string; username: string } {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) {
    throw new Error('Usuário é obrigatório.')
  }

  if (trimmed.includes('@')) {
    throw new Error('Informe apenas o nome de usuário, sem e-mail.')
  }

  const username = trimmed.replace(/[^a-z0-9._-]/g, '')
  if (!username) {
    throw new Error('Nome de usuário inválido.')
  }

  return { email: usernameToEmail(username), username }
}

const PROFILE_SELECT =
  'id, username, role, visao, esteira, diretoria_ids, equipe_id, permissions, created_at'

function normalizeProfileRow(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    username: String(row.username),
    role: row.role === 'admin' ? 'admin' : 'user',
    visao: (row.visao as UserProfile['visao']) ?? 'lider',
    esteira: (row.esteira as UserProfile['esteira']) ?? 'TODAS',
    diretoria_ids: Array.isArray(row.diretoria_ids) ? row.diretoria_ids.map(String) : [],
    equipe_id: row.equipe_id ? String(row.equipe_id) : null,
    permissions: parsePermissions(row.permissions),
    created_at: String(row.created_at ?? new Date().toISOString()),
  }
}

async function listAccessProfilesFromAuth(): Promise<UserProfile[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })

  if (error) {
    throw new Error(getErrorMessage(error, 'Erro ao listar usuários do Supabase Auth.'))
  }

  return (data.users ?? []).map((user) =>
    normalizeProfileRow({
      id: user.id,
      username:
        user.user_metadata?.username ??
        emailToUsername(user.email ?? '') ??
        'usuario',
      role: user.app_metadata?.role === 'admin' ? 'admin' : 'user',
      visao: user.app_metadata?.visao ?? (user.app_metadata?.role === 'admin' ? 'admin' : 'lider'),
      esteira: user.app_metadata?.esteira ?? 'TODAS',
      diretoria_ids: user.app_metadata?.diretoria_ids ?? [],
      equipe_id: user.app_metadata?.equipe_id ?? null,
      permissions: user.app_metadata?.permissions ?? [],
      created_at: user.created_at,
    })
  )
}

export async function listAccessProfiles(): Promise<UserProfile[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(PROFILE_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    const message = getErrorMessage(error, 'Erro ao listar perfis.')
    const shouldFallback =
      message.includes('column') ||
      message.includes('does not exist') ||
      (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'PGRST205')

    if (shouldFallback) {
      return listAccessProfilesFromAuth()
    }

    throw new Error(message)
  }

  if (!data?.length) {
    const authProfiles = await listAccessProfilesFromAuth().catch(() => [])
    if (authProfiles.length > 0) return authProfiles
  }

  return (data ?? []).map((row) => normalizeProfileRow(row as Record<string, unknown>))
}
