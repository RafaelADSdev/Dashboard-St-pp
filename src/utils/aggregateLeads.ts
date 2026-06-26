import { format, parseISO } from 'date-fns'
import {
  isEconomicoCategory,
  isGeralCategory,
} from '@/api/bitrixConfig'
import type { BitrixLead, FilterParams, LeadsDashboardData, StuppTeamOption, TeamDetail } from '@/api/types'
import type { StuppOrgStructure } from '@/api/bitrixDepartments'
import { getTeamLabel } from '@/api/bitrixDepartments'

interface EsteiraCounts {
  total: number
  geral: number
  economico: number
}

export function aggregateLeadsData(
  bitrixLeads: BitrixLead[],
  filters: FilterParams,
  stageLabels: Record<string, string>,
  counts: EsteiraCounts,
  org: StuppOrgStructure,
  equipeOptions: StuppTeamOption[]
): LeadsDashboardData {
  const allowedUserIds = new Set(
    filters.equipe
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
  const byStage = groupBy(filtered, 'stage_id')
  const funnelEconomico = filtered.filter((l) => isEconomicoCategory(l.category_id))
  const funnelGeral = filtered.filter((l) => isGeralCategory(l.category_id))

  const equipes = equipeOptions

  const byDiretoria = org.diretorias.map((diretoria) => {
    const userIds = new Set(diretoria.teams.flatMap((t) => t.userIds))
    const leads = filtered.filter((l) => userIds.has(l.assigned_by_id)).length
    return { id: diretoria.id, name: diretoria.name, leads }
  })

  const teamDetails: TeamDetail[] = org.diretorias.flatMap((diretoria) =>
    diretoria.teams.map((team) => {
      const teamLeads = filtered.filter((l) => team.userIds.includes(l.assigned_by_id))
      const byStageMap = groupBy(teamLeads, 'stage_id')

      return {
        id: team.id,
        label: getTeamLabel(team),
        diretoria: diretoria.name,
        leaderName: team.leaderName,
        leads: teamLeads.length,
        byStage: Object.entries(byStageMap).map(([stage, items]) => ({
          stage: stageLabels[stage] ?? stage,
          count: items.length,
        })),
        overTime: groupByDate(teamLeads),
      }
    })
  )

  return {
    totalLeads: counts.total,
    economicoCount: counts.economico,
    geralCount: counts.geral,
    byTeam: Object.entries(byTeam).map(([equipe, items]) => ({
      equipe,
      leads: items.length,
    })),
    byDiretoria,
    teamDetails,
    byStage: Object.entries(byStage).map(([stage, items]) => ({
      stage: stageLabels[stage] ?? stage,
      count: items.length,
    })),
    funnelEconomico: groupByStage(funnelEconomico, stageLabels),
    funnelGeral: groupByStage(funnelGeral, stageLabels),
    overTime: groupByDate(filtered),
    diretorias: org.diretorias.map((d) => d.name),
    equipes,
  }
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

function groupByStage(
  leads: { stage_id: string }[],
  stageLabels: Record<string, string>
) {
  const stages: Record<string, number> = {}
  for (const l of leads) {
    const label = stageLabels[l.stage_id] ?? l.stage_id
    stages[label] = (stages[label] ?? 0) + 1
  }
  return Object.entries(stages).map(([x, y]) => ({ x, y }))
}

function groupByDate(leads: BitrixLead[]) {
  const dates: Record<string, { economico: number; geral: number }> = {}

  for (const lead of leads) {
    const dateKey = format(parseISO(lead.date_create), 'dd/MM')
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
