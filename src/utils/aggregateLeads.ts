import { format, parseISO } from 'date-fns'
import {
  ESTEIRA_ECONOMICO_ID,
  ESTEIRA_GERAL_ID,
  isEconomicoCategory,
  isGeralCategory,
} from '@/api/bitrixConfig'
import type { StageCatalog } from '@/api/bitrixStages'
import {
  groupByStageBreakdown,
  groupByStageOrdered,
  isLeadInFailureStage,
} from '@/api/bitrixStages'
import type {
  BitrixLead,
  DiretoriaSummary,
  FilterParams,
  LeadsDashboardData,
  StuppTeamOption,
  TeamDetail,
} from '@/api/types'
import type { StuppOrgStructure } from '@/api/bitrixDepartments'
import { getTeamLabel } from '@/api/bitrixDepartments'
import { buildKanbanBoards } from '@/utils/buildKanbanBoards'
import { buildLeadExportDetails } from '@/utils/buildLeadExportDetails'

export function aggregateLeadsData(
  bitrixLeads: BitrixLead[],
  filters: FilterParams,
  stageCatalog: StageCatalog,
  org: StuppOrgStructure,
  equipeOptions: StuppTeamOption[],
  sourceLabels: Record<string, string> = {}
): LeadsDashboardData {
  const { labels, geral: geralStages, economico: economicoStages } = stageCatalog

  const allowedUserIds = new Set(
    filters.corretor
      ? org.allUserIds.includes(filters.corretor)
        ? [filters.corretor]
        : []
      : filters.equipe
        ? (org.diretorias.flatMap((d) => d.teams).find((t) => t.id === filters.equipe)?.userIds ?? [])
        : filters.diretoria
          ? (org.diretorias
              .find((d) => d.id === filters.diretoria || d.name === filters.diretoria)
              ?.teams.flatMap((t) => t.userIds) ?? org.allUserIds)
          : org.allUserIds
  )

  const filtered = bitrixLeads.filter((lead) => allowedUserIds.has(lead.assigned_by_id))

  const teamLabels = new Map(
    org.diretorias.flatMap((d) =>
      d.teams.map((t) => [t.id, getTeamLabel(t)] as const)
    )
  )

  const byTeam = groupBy(
    filtered.map((lead) => ({
      ...lead,
      equipe:
        teamLabels.get(org.userToTeamId[lead.assigned_by_id] ?? '') ??
        lead.equipe,
    })),
    'equipe'
  )
  const funnelEconomico = filtered.filter((l) => isEconomicoCategory(l.category_id))
  const funnelGeral = filtered.filter((l) => isGeralCategory(l.category_id))

  const geralCount = funnelGeral.length
  const economicoCount = funnelEconomico.length
  const totalLeads =
    filters.esteira === 'GERAL'
      ? geralCount
      : filters.esteira === 'ECONOMICO'
        ? economicoCount
        : geralCount + economicoCount

  const leadsForPerdidos =
    filters.esteira === 'GERAL'
      ? funnelGeral
      : filters.esteira === 'ECONOMICO'
        ? funnelEconomico
        : filtered

  const leadsPerdidos = leadsForPerdidos.filter((lead) => {
    const categoryId = lead.category_id ?? ''
    const definitions = isEconomicoCategory(categoryId)
      ? stageCatalog.economico
      : isGeralCategory(categoryId)
        ? stageCatalog.geral
        : [...stageCatalog.geral, ...stageCatalog.economico]

    return isLeadInFailureStage(lead, definitions)
  }).length

  const byDiretoriaFromLeads: DiretoriaSummary[] = org.diretorias.map((diretoria) => {
    const userIds = new Set(diretoria.teams.flatMap((t) => t.userIds))
    const leads = filtered.filter((l) => userIds.has(l.assigned_by_id)).length
    return { id: diretoria.id, name: diretoria.name, leads }
  })

  const byTeamFromLeads = Object.entries(byTeam).map(([equipe, items]) => ({
    equipe,
    leads: items.length,
  }))

  const teamDetails: TeamDetail[] = org.diretorias.flatMap((diretoria) =>
    diretoria.teams.map((team) => {
      const teamLeads = filtered.filter((l) => team.userIds.includes(l.assigned_by_id))
      const byStageForTeam = buildByStageForFilter(teamLeads, filters.esteira, stageCatalog)

      return {
        id: team.id,
        label: getTeamLabel(team),
        diretoria: diretoria.name,
        leaderName: team.leaderName,
        leads: teamLeads.length,
        byStage: byStageForTeam,
        overTime: groupByDate(teamLeads),
      }
    })
  )

  return {
    totalLeads,
    leadsPerdidos,
    corretoresAtivosRoleta: 0,
    economicoCount,
    geralCount,
    byTeam: byTeamFromLeads,
    byDiretoria: byDiretoriaFromLeads,
    teamDetails,
    byStage: buildByStageForFilter(filtered, filters.esteira, stageCatalog),
    bySource: groupBySource(filtered, sourceLabels),
    kanbanBoards: buildKanbanBoards(filtered, filters.esteira, stageCatalog, sourceLabels),
    funnelEconomico: groupByStageOrdered(
      funnelEconomico,
      economicoStages,
      labels,
      ESTEIRA_ECONOMICO_ID
    ),
    funnelGeral: groupByStageOrdered(
      funnelGeral,
      geralStages,
      labels,
      ESTEIRA_GERAL_ID
    ),
    overTime: groupByDate(filtered),
    leadDetails: buildLeadExportDetails(filtered, stageCatalog, sourceLabels),
    diretorias: org.diretorias.map((d) => d.name),
    equipes: equipeOptions,
  }
}

function buildByStageForFilter(
  leads: BitrixLead[],
  esteira: string,
  stageCatalog: StageCatalog
) {
  if (esteira === 'GERAL') {
    return groupByStageBreakdown(
      leads.filter((lead) => isGeralCategory(lead.category_id)),
      stageCatalog.geral,
      stageCatalog.labels,
      ESTEIRA_GERAL_ID
    )
  }

  if (esteira === 'ECONOMICO') {
    return groupByStageBreakdown(
      leads.filter((lead) => isEconomicoCategory(lead.category_id)),
      stageCatalog.economico,
      stageCatalog.labels,
      ESTEIRA_ECONOMICO_ID
    )
  }

  const geral = groupByStageBreakdown(
    leads.filter((lead) => isGeralCategory(lead.category_id)),
    stageCatalog.geral,
    stageCatalog.labels,
    ESTEIRA_GERAL_ID
  )
  const economico = groupByStageBreakdown(
    leads.filter((lead) => isEconomicoCategory(lead.category_id)),
    stageCatalog.economico,
    stageCatalog.labels,
    ESTEIRA_ECONOMICO_ID
  )

  return [...geral, ...economico]
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = String(item[key] ?? 'Sem valor')
      acc[k] = [...(acc[k] ?? []), item]
      return acc
    },
    {} as Record<string, T[]>
  )
}

function groupBySource(
  leads: BitrixLead[],
  sourceLabels: Record<string, string>
): { source: string; count: number }[] {
  const counts: Record<string, number> = {}

  for (const lead of leads) {
    const key = lead.source_id || '__empty__'
    counts[key] = (counts[key] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([id, count]) => ({
      source: id === '__empty__' ? 'Sem origem' : (sourceLabels[id] ?? id),
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

function parseEntryDate(value: string): Date | null {
  const normalized = String(value ?? '').trim()
  if (!normalized) return null
  const parsed = parseISO(normalized.includes('T') ? normalized : `${normalized.replace(' ', 'T')}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function groupByDate(leads: BitrixLead[]) {
  const dates: Record<string, { economico: number; geral: number }> = {}

  for (const lead of leads) {
    const entryDate = lead.date_arrived || lead.date_create
    const parsed = parseEntryDate(entryDate)
    if (!parsed) continue
    const dateKey = format(parsed, 'dd/MM')
    if (!dates[dateKey]) {
      dates[dateKey] = { economico: 0, geral: 0 }
    }
    if (isEconomicoCategory(lead.category_id)) {
      dates[dateKey].economico += 1
    } else if (isGeralCategory(lead.category_id)) {
      dates[dateKey].geral += 1
    }
  }

  return Object.entries(dates)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => {
      const [da, ma] = a.date.split('/').map(Number)
      const [db, mb] = b.date.split('/').map(Number)
      return ma - mb || da - db
    })
}
