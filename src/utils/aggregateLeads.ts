import { format, parseISO } from 'date-fns'
import {
  ESTEIRA_ECONOMICO_ID,
  ESTEIRA_GERAL_ID,
  isEconomicoCategory,
  isGeralCategory,
} from '@/api/bitrixConfig'
import type { StageCatalog } from '@/api/bitrixStages'
import {
  countLostLeadsFromFunnel,
  countLostLeadsInPipeline,
  groupByStageBreakdown,
  groupByStageOrdered,
  isLeadInLostKpiStage,
  LOST_KPI_STAGE_NAME_ECONOMICO,
  LOST_KPI_STAGE_NAME_GERAL,
} from '@/api/bitrixStages'
import type {
  BitrixLead,
  DiretoriaSummary,
  FilterParams,
  LeadsDashboardData,
  RoletaLeadSummary,
  SourceLeadSummary,
  StuppTeamOption,
  TeamDetail,
} from '@/api/types'
import type { StuppOrgStructure } from '@/api/bitrixDepartments'
import { getTeamLabel } from '@/api/bitrixDepartments'
import { isStuppRoletaTitle } from '@/api/bitrixRoletas'
import { findDiretoria } from '@/lib/diretoriaScope'
import { resolveAssignedByIds } from '@/lib/orgPreview'
import { normalizeRoletaTitleKey } from '@/utils/filterRoletaLeads'
import { buildKanbanBoards } from '@/utils/buildKanbanBoards'
import { getLeadsAtivos } from '@/utils/operationalAlert'

export function aggregateLeadsData(
  bitrixLeads: BitrixLead[],
  filters: FilterParams,
  stageCatalog: StageCatalog,
  org: StuppOrgStructure,
  equipeOptions: StuppTeamOption[],
  sourceLabels: Record<string, string> = {},
  allowedRoletaTitleKeys?: Set<string>,
  options: { includeOperationalDetails?: boolean } = {}
): LeadsDashboardData {
  const includeOperationalDetails = options.includeOperationalDetails ?? true
  const { labels, geral: geralStages, economico: economicoStages } = stageCatalog

  const allowedUserIds = new Set(
    resolveAssignedByIds(org, {
      diretoria: filters.diretoria,
      equipe: filters.equipe,
      corretor: filters.corretor,
    })
  )

  const selectedDiretoria = filters.diretoria ? findDiretoria(org, filters.diretoria) : undefined
  const scopedDiretorias = selectedDiretoria ? [selectedDiretoria] : org.diretorias

  const filtered = bitrixLeads.filter((lead) => allowedUserIds.has(lead.assigned_by_id))

  const teamLabels = new Map(
    org.diretorias.flatMap((d) =>
      d.teams.map((t) => [t.id, getTeamLabel(t)] as const)
    )
  )

  const assignedLeadCounts = new Map<string, number>()
  const teamLeadCounts = new Map<string, number>()
  for (const lead of filtered) {
    assignedLeadCounts.set(
      lead.assigned_by_id,
      (assignedLeadCounts.get(lead.assigned_by_id) ?? 0) + 1
    )

    const teamLabel =
      teamLabels.get(org.userToTeamId[lead.assigned_by_id] ?? '') ??
      lead.equipe
    teamLeadCounts.set(teamLabel, (teamLeadCounts.get(teamLabel) ?? 0) + 1)
  }
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

  const funnelEconomicoData = groupByStageOrdered(
    funnelEconomico,
    economicoStages,
    labels,
    ESTEIRA_ECONOMICO_ID
  )
  const funnelGeralData = groupByStageOrdered(
    funnelGeral,
    geralStages,
    labels,
    ESTEIRA_GERAL_ID
  )

  const economicoPerdidos = Math.max(
    countLostLeadsInPipeline(
      funnelEconomico,
      economicoStages,
      LOST_KPI_STAGE_NAME_ECONOMICO,
      ESTEIRA_ECONOMICO_ID,
      'economico'
    ),
    countLostLeadsFromFunnel(funnelEconomicoData, LOST_KPI_STAGE_NAME_ECONOMICO, 'economico')
  )
  const geralPerdidos = Math.max(
    countLostLeadsInPipeline(
      funnelGeral,
      geralStages,
      LOST_KPI_STAGE_NAME_GERAL,
      ESTEIRA_GERAL_ID,
      'geral'
    ),
    countLostLeadsFromFunnel(funnelGeralData, LOST_KPI_STAGE_NAME_GERAL, 'geral')
  )

  const leadsPerdidos =
    filters.esteira === 'GERAL'
      ? geralPerdidos
      : filters.esteira === 'ECONOMICO'
        ? economicoPerdidos
        : economicoPerdidos + geralPerdidos

  const byDiretoriaFromLeads: DiretoriaSummary[] = scopedDiretorias.map((diretoria) => {
    const userIds = new Set(diretoria.teams.flatMap((t) => t.userIds))
    if (diretoria.leaderId) userIds.add(diretoria.leaderId)
    const leads = [...userIds].reduce(
      (total, userId) => total + (assignedLeadCounts.get(userId) ?? 0),
      0
    )
    return { id: diretoria.id, name: diretoria.name, leads }
  })

  const teamDetails: TeamDetail[] = includeOperationalDetails
    ? scopedDiretorias.flatMap((diretoria) =>
        diretoria.teams.map((team) => {
          const teamUserIds = new Set(team.userIds)
          const teamLeads = filtered.filter((lead) => teamUserIds.has(lead.assigned_by_id))
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
    : []

  const byTeamFromLeads = selectedDiretoria
    ? selectedDiretoria.teams.map((team) => ({
        equipe: getTeamLabel(team),
        leads: team.userIds.reduce(
          (total, userId) => total + (assignedLeadCounts.get(userId) ?? 0),
          0
        ),
      }))
    : [...teamLeadCounts.entries()].map(([equipe, leads]) => ({ equipe, leads }))

  return {
    totalLeads,
    leadsPerdidos,
    leadsAtivos: getLeadsAtivos(totalLeads, leadsPerdidos),
    corretoresAtivosRoleta: 0,
    economicoCount,
    geralCount,
    byTeam: byTeamFromLeads,
    byDiretoria: byDiretoriaFromLeads,
    teamDetails,
    byStage: includeOperationalDetails
      ? buildByStageForFilter(filtered, filters.esteira, stageCatalog)
      : [],
    bySource: groupBySourceWithRoleta(filtered, sourceLabels, allowedRoletaTitleKeys),
    byRoleta: groupByRoleta(filtered, stageCatalog, allowedRoletaTitleKeys),
    kanbanBoards: includeOperationalDetails
      ? buildKanbanBoards(filtered, filters.esteira, stageCatalog, sourceLabels)
      : [],
    funnelEconomico: funnelEconomicoData,
    funnelGeral: funnelGeralData,
    overTime: groupByDate(filtered),
    diretorias: includeOperationalDetails ? scopedDiretorias.map((d) => d.name) : [],
    equipes: includeOperationalDetails
      ? selectedDiretoria
        ? equipeOptions.filter((equipe) => equipe.diretoria === selectedDiretoria.name)
        : equipeOptions
      : [],
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

function resolveSourceLabel(sourceId: string, sourceLabels: Record<string, string>): string {
  if (!sourceId) return 'Sem origem'
  return sourceLabels[sourceId] ?? sourceId
}

function groupBySourceWithRoleta(
  leads: BitrixLead[],
  sourceLabels: Record<string, string>,
  allowedRoletaTitleKeys?: Set<string>
): SourceLeadSummary[] {
  const bySource = new Map<string, { total: number; roletas: Map<string, number> }>()

  for (const lead of leads) {
    const sourceName = resolveSourceLabel(lead.source_id, sourceLabels)
    const roletaName = lead.roleta?.trim() || ''

    const entry = bySource.get(sourceName) ?? { total: 0, roletas: new Map<string, number>() }
    entry.total += 1

    if (roletaName && isStuppRoletaTitle(roletaName)) {
      if (
        !allowedRoletaTitleKeys ||
        allowedRoletaTitleKeys.has(normalizeRoletaTitleKey(roletaName))
      ) {
        entry.roletas.set(roletaName, (entry.roletas.get(roletaName) ?? 0) + 1)
      }
    }

    bySource.set(sourceName, entry)
  }

  return [...bySource.entries()]
    .map(([source, { total, roletas }]) => {
      const roletaList = [...roletas.entries()]
        .map(([roleta, count]) => ({ roleta, count }))
        .sort((a, b) => b.count - a.count || a.roleta.localeCompare(b.roleta, 'pt-BR'))

      return {
        source,
        count: total,
        roletas: roletaList,
      }
    })
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source, 'pt-BR'))
}

function groupByRoleta(
  leads: BitrixLead[],
  stageCatalog: StageCatalog,
  allowedRoletaTitleKeys?: Set<string>
): RoletaLeadSummary[] {
  const byRoleta = new Map<string, { total: number; perdidos: number }>()

  for (const lead of leads) {
    const roletaName = lead.roleta?.trim() || ''
    if (!roletaName || !isStuppRoletaTitle(roletaName)) continue
    if (
      allowedRoletaTitleKeys &&
      !allowedRoletaTitleKeys.has(normalizeRoletaTitleKey(roletaName))
    ) {
      continue
    }

    const entry = byRoleta.get(roletaName) ?? { total: 0, perdidos: 0 }
    entry.total += 1
    if (
      isLeadInLostKpiStage(lead, stageCatalog, ESTEIRA_ECONOMICO_ID, ESTEIRA_GERAL_ID)
    ) {
      entry.perdidos += 1
    }
    byRoleta.set(roletaName, entry)
  }

  return [...byRoleta.entries()]
    .map(([roleta, { total, perdidos }]) => ({
      roleta,
      count: total,
      perdidos,
      ativos: getLeadsAtivos(total, perdidos),
    }))
    .sort((a, b) => b.count - a.count || a.roleta.localeCompare(b.roleta, 'pt-BR'))
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
