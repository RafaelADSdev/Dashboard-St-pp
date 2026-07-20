import type { UserVisao } from '@/types/access'

export type VisaoScopeMode = 'all' | 'diretoria' | 'equipe'

export interface AccessScopeInput {
  visao: UserVisao
  diretoriaIds: string[]
  equipeId?: string | null
}

export interface AccessScopeResult {
  diretoriaIds: string[]
  equipeId: string | null
}

export function getVisaoScopeMode(visao: UserVisao): VisaoScopeMode {
  switch (visao) {
    case 'admin':
      return 'all'
    case 'diretor':
      return 'diretoria'
    case 'lider':
    case 'usuario':
      return 'equipe'
    default:
      return 'equipe'
  }
}

export function requiresEquipe(visao: UserVisao): boolean {
  return getVisaoScopeMode(visao) === 'equipe'
}

export function requiresDiretoria(visao: UserVisao): boolean {
  return getVisaoScopeMode(visao) !== 'all'
}

export function allowsMultipleDiretorias(visao: UserVisao): boolean {
  return visao === 'admin'
}

interface OrgTeamRef {
  id: string
  diretoriaId?: string
}

interface OrgDiretoriaRef {
  id: string
  teams: OrgTeamRef[]
}

export function validateAccessScope(
  input: AccessScopeInput,
  orgDiretorias: OrgDiretoriaRef[] = []
): AccessScopeResult {
  const mode = getVisaoScopeMode(input.visao)
  const diretoriaIds = [...new Set(input.diretoriaIds.map(String).filter(Boolean))]
  const equipeId = input.equipeId?.trim() || null

  if (mode === 'all') {
    if (equipeId) {
      throw new Error('Administradores não devem ter equipe vinculada.')
    }
    return { diretoriaIds, equipeId: null }
  }

  if (diretoriaIds.length !== 1) {
    throw new Error('Selecione exatamente uma diretoria para esta visão.')
  }

  const diretoriaId = diretoriaIds[0]
  const diretoria = orgDiretorias.find((item) => item.id === diretoriaId)

  if (orgDiretorias.length > 0 && !diretoria) {
    throw new Error('Diretoria selecionada não encontrada na estrutura organizacional.')
  }

  if (mode === 'diretoria') {
    if (equipeId) {
      throw new Error('Diretores não devem ter equipe vinculada.')
    }
    return { diretoriaIds: [diretoriaId], equipeId: null }
  }

  if (!equipeId) {
    throw new Error('Selecione a equipe vinculada a esta visão.')
  }

  const team = diretoria?.teams.find((item) => item.id === equipeId)
  if (diretoria && !team) {
    throw new Error('A equipe selecionada não pertence à diretoria escolhida.')
  }

  return { diretoriaIds: [diretoriaId], equipeId }
}
