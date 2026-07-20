import { SEM_LIDERANCA_ID } from '@/lib/resolveRoletaLideranca'
import type { RoletaCorretorMember } from '@/api/types'

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export interface FilterActiveRoletaCorretoresOptions {
  activeStuppUserIds?: Set<string>
}

export function getCorretorLiderancaGroupKey(corretor: RoletaCorretorMember): string {
  return corretor.liderancaName ?? corretor.equipe ?? 'Sem liderança'
}

export function isCorretorSemLideranca(corretor: RoletaCorretorMember): boolean {
  if (corretor.liderancaId === SEM_LIDERANCA_ID) return true

  return normalizeLabel(getCorretorLiderancaGroupKey(corretor)) === 'sem lideranca'
}

export function isCorretorAtivoNoHub(
  corretor: RoletaCorretorMember,
  options: FilterActiveRoletaCorretoresOptions = {}
): boolean {
  if (isCorretorSemLideranca(corretor)) return false
  if (!corretor.corretorUserId) return false

  const { activeStuppUserIds } = options
  if (activeStuppUserIds && !activeStuppUserIds.has(corretor.corretorUserId)) {
    return false
  }

  return Boolean(corretor.equipeId || corretor.diretoriaId)
}

export function filterActiveRoletaCorretores(
  corretores: RoletaCorretorMember[],
  options: FilterActiveRoletaCorretoresOptions = {}
): RoletaCorretorMember[] {
  return corretores.filter((corretor) => isCorretorAtivoNoHub(corretor, options))
}

export function summarizeCorretorScope(corretores: RoletaCorretorMember[]) {
  const diretoriaIds = new Set<string>()
  const liderancaIds = new Set<string>()
  const equipeIds = new Set<string>()

  for (const corretor of corretores) {
    if (corretor.diretoriaId) diretoriaIds.add(corretor.diretoriaId)
    if (corretor.liderancaId && corretor.liderancaId !== SEM_LIDERANCA_ID) {
      liderancaIds.add(corretor.liderancaId)
    }
    if (corretor.equipeId) equipeIds.add(corretor.equipeId)
  }

  return {
    diretoriaIds: [...diretoriaIds],
    liderancaIds: [...liderancaIds],
    equipeIds: [...equipeIds],
  }
}
