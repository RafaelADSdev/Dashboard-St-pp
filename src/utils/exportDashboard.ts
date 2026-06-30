import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ExportLeadDetail, FilterParams, LeadsDashboardData, StuppRoletaOption } from '@/api/types'
import type { OrgPreview } from '@/lib/orgPreview'
import { computeDuration, formatBitrixDateDisplay } from '@/utils/leadTiming'

export type ExportEsteira = 'TODAS' | 'GERAL' | 'ECONOMICO'

export interface ExportContext {
  pageTitle: string
  esteira: ExportEsteira
  filters: FilterParams
  filterLabels: {
    periodo: string
    esteira: string
    diretoria: string
    equipe: string
    roleta: string
  }
  data: LeadsDashboardData
  exportedAt: string
}

export function resolveExportEsteira(pathname: string, filters: FilterParams): ExportEsteira {
  if (pathname.startsWith('/esteira-geral')) return 'GERAL'
  if (pathname.startsWith('/esteira-economico')) return 'ECONOMICO'
  return (filters.esteira as ExportEsteira) || 'TODAS'
}

export function resolvePageTitle(pathname: string): string {
  if (pathname.startsWith('/roletas')) return 'Roletas Stüpp'
  if (pathname.startsWith('/esteira-geral')) return 'Esteira Comercial Geral'
  if (pathname.startsWith('/esteira-economico')) return 'Esteira Comercial Econômico'
  return 'Visão geral comercial'
}

export function mergeFiltersForPage(pathname: string, filters: FilterParams): FilterParams {
  if (pathname.startsWith('/esteira-geral')) return { ...filters, esteira: 'GERAL' }
  if (pathname.startsWith('/esteira-economico')) return { ...filters, esteira: 'ECONOMICO' }
  return filters
}

function formatPeriod(dateFrom: string, dateTo: string): string {
  try {
    const from = format(parseISO(dateFrom), 'dd/MM/yyyy', { locale: ptBR })
    const to = format(parseISO(dateTo), 'dd/MM/yyyy', { locale: ptBR })
    return `${from} — ${to}`
  } catch {
    return `${dateFrom} — ${dateTo}`
  }
}

function esteiraLabel(esteira: ExportEsteira): string {
  switch (esteira) {
    case 'GERAL':
      return 'Comercial Geral'
    case 'ECONOMICO':
      return 'Comercial Econômico'
    default:
      return 'Todas'
  }
}

export function buildFilterLabels(
  filters: FilterParams,
  esteira: ExportEsteira,
  org?: OrgPreview,
  roletas?: StuppRoletaOption[]
): ExportContext['filterLabels'] {
  const diretoria =
    org?.diretorias.find((d) => d.id === filters.diretoria)?.name ?? 'Todas'

  let equipe = 'Todas'
  if (filters.equipe && org) {
    for (const d of org.diretorias) {
      const team = d.teams.find((t) => t.id === filters.equipe)
      if (team) {
        equipe = team.label
        break
      }
    }
  }

  const roleta =
    roletas?.find((r) => r.id === filters.roleta)?.title ??
    (filters.roleta ? `Roleta #${filters.roleta}` : 'Todas')

  return {
    periodo: formatPeriod(filters.dateFrom, filters.dateTo),
    esteira: esteiraLabel(esteira),
    diretoria,
    equipe,
    roleta,
  }
}

function refreshLeadDetailTimings(
  details: ExportLeadDetail[] | undefined,
  reference: Date
): ExportLeadDetail[] {
  if (!details?.length) return []

  return details
    .map((lead) => {
      const tempoNaEsteira = computeDuration(lead.dateCreateIso, reference)
      const tempoSemAtualizar = computeDuration(lead.dateModifyIso, reference)

      return {
        ...lead,
        dateCreate: formatBitrixDateDisplay(lead.dateCreateIso),
        dateModify: formatBitrixDateDisplay(lead.dateModifyIso),
        daysInPipeline: tempoNaEsteira.days,
        tempoNaEsteira: tempoNaEsteira.label,
        daysWithoutUpdate: tempoSemAtualizar.days,
        tempoSemAtualizar: tempoSemAtualizar.label,
      }
    })
    .sort(
      (a, b) =>
        b.daysWithoutUpdate - a.daysWithoutUpdate ||
        b.daysInPipeline - a.daysInPipeline ||
        a.title.localeCompare(b.title, 'pt-BR')
    )
}

export function buildExportContext(
  pathname: string,
  filters: FilterParams,
  data: LeadsDashboardData,
  org?: OrgPreview,
  roletas?: StuppRoletaOption[]
): ExportContext {
  const merged = mergeFiltersForPage(pathname, filters)
  const esteira = resolveExportEsteira(pathname, merged)
  const exportedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  const reference = new Date()

  return {
    pageTitle: resolvePageTitle(pathname),
    esteira,
    filters: merged,
    filterLabels: buildFilterLabels(merged, esteira, org, roletas),
    data: {
      ...data,
      leadDetails: refreshLeadDetailTimings(data.leadDetails, reference),
    },
    exportedAt,
  }
}

export function buildExportFilename(ctx: ExportContext, extension: 'pdf' | 'xlsx'): string {
  const slug = ctx.pageTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const date = format(new Date(), 'yyyy-MM-dd')
  return `dashboard-stupp-${slug}-${date}.${extension}`
}

function isNonZero(value: string | number): boolean {
  return Number(value) !== 0
}

function filterRowsByValue(
  rows: (string | number)[][],
  valueIndex = 1
): (string | number)[][] {
  return rows.filter((row) => isNonZero(row[valueIndex]))
}

export interface PdfTableSection {
  title: string
  head: string[]
  body: (string | number)[][]
}

function kpiRows(ctx: ExportContext): (string | number)[][] {
  if (ctx.esteira === 'TODAS') {
    return filterRowsByValue([
      ['Total de leads', ctx.data.totalLeads],
      ['Comercial Econômico', ctx.data.economicoCount],
      ['Comercial Geral', ctx.data.geralCount],
    ])
  }

  if (ctx.esteira === 'GERAL') {
    return filterRowsByValue([['Comercial Geral', ctx.data.geralCount]])
  }

  return filterRowsByValue([['Comercial Econômico', ctx.data.economicoCount]])
}

export function getPdfSections(ctx: ExportContext): PdfTableSection[] {
  const sections: PdfTableSection[] = [
    {
      title: 'Indicadores',
      head: ['Indicador', 'Valor'],
      body: kpiRows(ctx),
    },
    {
      title: 'Leads por diretoria',
      head: ['Diretoria', 'Leads'],
      body: filterRowsByValue(ctx.data.byDiretoria.map((row) => [row.name, row.leads])),
    },
    {
      title: 'Leads por equipe',
      head: ['Equipe', 'Leads'],
      body: filterRowsByValue(ctx.data.byTeam.map((row) => [row.equipe, row.leads])),
    },
  ]

  if (ctx.esteira === 'TODAS') {
    sections.push(
      {
        title: 'Evolução no período',
        head: ['Data', 'Econômico', 'Geral'],
        body: ctx.data.overTime
          .filter((row) => row.economico !== 0 || row.geral !== 0)
          .map((row) => [row.date, row.economico, row.geral]),
      },
      {
        title: 'Funil — Comercial Econômico',
        head: ['Etapa', 'Leads'],
        body: filterRowsByValue(ctx.data.funnelEconomico.map((row) => [row.x, row.y])),
      },
      {
        title: 'Funil — Comercial Geral',
        head: ['Etapa', 'Leads'],
        body: filterRowsByValue(ctx.data.funnelGeral.map((row) => [row.x, row.y])),
      }
    )
  } else if (ctx.esteira === 'GERAL') {
    sections.push(
      {
        title: 'Evolução no período',
        head: ['Data', 'Comercial Geral'],
        body: ctx.data.overTime
          .filter((row) => row.geral !== 0)
          .map((row) => [row.date, row.geral]),
      },
      {
        title: 'Funil — Comercial Geral',
        head: ['Etapa', 'Leads'],
        body: filterRowsByValue(ctx.data.funnelGeral.map((row) => [row.x, row.y])),
      }
    )
  } else {
    sections.push(
      {
        title: 'Evolução no período',
        head: ['Data', 'Comercial Econômico'],
        body: ctx.data.overTime
          .filter((row) => row.economico !== 0)
          .map((row) => [row.date, row.economico]),
      },
      {
        title: 'Funil — Comercial Econômico',
        head: ['Etapa', 'Leads'],
        body: filterRowsByValue(ctx.data.funnelEconomico.map((row) => [row.x, row.y])),
      }
    )
  }

  sections.push({
    title: 'Leads por fase',
    head: ['Fase', 'Leads'],
    body: filterRowsByValue(ctx.data.byStage.map((row) => [row.stage, row.count])),
  })

  sections.push({
    title: 'Leads por origem',
    head: ['Origem', 'Leads'],
    body: filterRowsByValue(ctx.data.bySource.map((row) => [row.source, row.count])),
  })

  if ((ctx.data.leadDetails ?? []).length > 0) {
    sections.push({
      title: 'Detalhamento — data de entrada',
      head: [
        'ID',
        'Negociação',
        'Esteira',
        'Fase',
        'Corretor',
        'Data entrada',
        'Tempo na esteira',
      ],
      body: ctx.data.leadDetails.map((lead) => [
        lead.id,
        lead.title,
        lead.esteira,
        lead.stage,
        lead.corretor,
        lead.dateCreate,
        lead.tempoNaEsteira,
      ]),
    })
  }

  return sections
}
