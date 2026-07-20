import { NextResponse } from 'next/server'
import { validateAccessScope } from '@/lib/accessScope'
import { getErrorMessage } from '@/lib/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  listAccessProfiles,
  requireAdminUser,
  resolveAccessUsername,
} from '@/lib/supabase/access'
import { getCachedOrgStructure } from '@/lib/server/cachedBitrix'
import type { CreateAccessPayload, UserEsteira, UserVisao } from '@/types/access'
import { parsePermissions } from '@/types/access'

function parseVisao(value: unknown): UserVisao | null {
  if (value === 'admin' || value === 'diretor' || value === 'lider' || value === 'usuario') {
    return value
  }
  return null
}

function parseEsteira(value: unknown): UserEsteira | null {
  if (value === 'TODAS' || value === 'GERAL' || value === 'ECONOMICO') {
    return value
  }
  return null
}

export async function GET() {
  const auth = await requireAdminUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const profiles = await listAccessProfiles()
    return NextResponse.json({ profiles })
  } catch (error) {
    const message = getErrorMessage(error, 'Erro ao listar acessos.')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: CreateAccessPayload
  try {
    body = (await request.json()) as CreateAccessPayload
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const visao = parseVisao(body.visao)
  const esteira = parseEsteira(body.esteira)
  const password = body.password?.trim() ?? ''

  if (!body.username?.trim()) {
    return NextResponse.json({ error: 'Usuário é obrigatório.' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
  }

  if (!visao) {
    return NextResponse.json({ error: 'Visão inválida.' }, { status: 400 })
  }

  if (!esteira) {
    return NextResponse.json({ error: 'Esteira inválida.' }, { status: 400 })
  }

  const diretoriaIds = Array.isArray(body.diretoriaIds)
    ? body.diretoriaIds.map(String).filter(Boolean)
    : []

  let scope: { diretoriaIds: string[]; equipeId: string | null }

  try {
    const org = await getCachedOrgStructure().catch(() => null)
    scope = validateAccessScope(
      {
        visao,
        diretoriaIds,
        equipeId: body.equipeId,
      },
      org?.diretorias ?? []
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Escopo de acesso inválido.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  let email: string
  let username: string

  try {
    const resolved = resolveAccessUsername(body.username)
    email = resolved.email
    username = resolved.username
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Usuário inválido.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const permissions = parsePermissions(body.permissions)
  const authRole = visao === 'admin' ? 'admin' : 'user'
  const effectivePermissions = authRole === 'admin' ? [] : permissions

  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role: authRole,
      visao,
      esteira,
      diretoria_ids: scope.diretoriaIds,
      equipe_id: scope.equipeId,
      permissions: effectivePermissions,
    },
    user_metadata: { username },
  })

  if (createError) {
    const message =
      createError.message.includes('already') || createError.message.includes('registered')
        ? 'Já existe um usuário com este nome.'
        : createError.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: created.user.id,
      username,
      role: authRole,
      visao,
      esteira,
      diretoria_ids: scope.diretoriaIds,
      equipe_id: scope.equipeId,
      permissions: effectivePermissions,
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return NextResponse.json(
      { error: getErrorMessage(profileError, 'Erro ao salvar perfil do usuário.') },
      { status: 500 }
    )
  }

  return NextResponse.json({
    profile: {
      id: created.user.id,
      username,
      role: authRole,
      visao,
      esteira,
      diretoria_ids: scope.diretoriaIds,
      equipe_id: scope.equipeId,
      permissions: effectivePermissions,
      created_at: created.user.created_at,
    },
  })
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário é obrigatório.' }, { status: 400 })
  }

  if (auth.user?.id === userId) {
    return NextResponse.json({ error: 'Você não pode excluir o próprio acesso.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
