import type { RoletasDashboardData, RoletaCorretorMember, RoletaStat, StuppRoletaOption } from '@/api/types'
import type { RoletaOperationalStatus } from '@/lib/roletaStatus'
import { SEM_LIDERANCA_ID } from '@/lib/resolveRoletaLideranca'

function enrichCorretoresWithLeadCounts(
  corretores: RoletaCorretorMember[],
  leadCounts?: RoletaStat['corretorLeadCounts']
): RoletaCorretorMember[] {
  return corretores.map((corretor) => {
    const counts = corretor.corretorUserId
      ? leadCounts?.[corretor.corretorUserId]
      : undefined

    return {
      ...corretor,
      totalLeads: counts?.totalLeads ?? 0,
      geralLeads: counts?.geralLeads ?? 0,
      economicoLeads: counts?.economicoLeads ?? 0,
    }
  })
}

export function mergeRoletasPageData(
  catalog: StuppRoletaOption[] | undefined,
  stats: RoletasDashboardData | undefined
): RoletasDashboardData | null {
  if (!catalog?.length) return stats ?? null

  const statsById = new Map((stats?.roletas ?? []).map((item) => [item.id, item]))

  const roletas: RoletaStat[] = catalog.map((item) => {
    const fromStats = statsById.get(item.id)
    const meta = {
      id: item.id,
      title: item.title,
      status: (item.status ?? (item.isActive ? 'ativa' : 'suspensa')) as RoletaOperationalStatus,
      liderancaId: item.liderancaId ?? SEM_LIDERANCA_ID,
      liderancaName: item.liderancaName ?? 'Sem liderança',
      createdAt: item.createdAt,
      diretoriaIds: item.diretoriaIds ?? [],
      liderancaIds: item.liderancaIds ?? [],
      equipeIds: item.equipeIds ?? [],
    }

    if (fromStats) {
      return {
        ...fromStats,
        ...meta,
        corretores: enrichCorretoresWithLeadCounts(
          item.corretores ?? [],
          fromStats.corretorLeadCounts
        ),
      }
    }

    return {
      ...meta,
      corretores: enrichCorretoresWithLeadCounts(item.corretores ?? []),
      totalLeads: 0,
      geralLeads: 0,
      economicoLeads: 0,
    }
  })

  const activeRoletas = roletas.filter((item) => item.status === 'ativa').length
  const novasRoletas = roletas.filter((item) => item.status === 'nova').length
  const suspensasRoletas = roletas.filter((item) => item.status === 'suspensa').length

  const liderancas =
    stats?.liderancas ??
    [...new Map(
      roletas
        .filter((item) => item.liderancaId !== SEM_LIDERANCA_ID)
        .map((item) => [item.liderancaId, { id: item.liderancaId, name: item.liderancaName }])
    ).values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return {
    totalLeads: stats?.totalLeads ?? 0,
    activeRoletas,
    novasRoletas,
    suspensasRoletas,
    roletas,
    liderancas,
  }
}
