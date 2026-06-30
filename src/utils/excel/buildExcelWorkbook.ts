import XLSX from 'xlsx-js-style'
import type { ExportContext } from '../exportDashboard'

const COLORS = {
  navy: '001A3D',
  surface: '0A2A5E',
  accent: '22C55E',
  white: 'FFFFFF',
  muted: '94A3B8',
  rowAlt: 'F1F5F9',
  border: 'CBD5E1',
} as const

interface TableSection {
  title: string
  labelHeader: string
  valueHeader: string
  rows: { label: string; value: number }[]
}

function isNonZero(value: number): boolean {
  return value !== 0
}

function filterNonZeroRows(rows: { label: string; value: number }[]): { label: string; value: number }[] {
  return rows.filter((row) => isNonZero(row.value))
}

function encode(r: number, c: number): string {
  return XLSX.utils.encode_cell({ r, c })
}

function setCell(
  sheet: XLSX.WorkSheet,
  r: number,
  c: number,
  value: string | number,
  style?: XLSX.CellObject['s']
): void {
  const cell: XLSX.CellObject = {
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
  }
  if (style) cell.s = style
  if (typeof value === 'number') cell.z = '#,##0'
  sheet[encode(r, c)] = cell
}

function merge(sheet: XLSX.WorkSheet, from: string, to: string): void {
  sheet['!merges'] = sheet['!merges'] ?? []
  sheet['!merges'].push(XLSX.utils.decode_range(`${from}:${to}`))
}

const titleStyle: XLSX.CellObject['s'] = {
  font: { bold: true, sz: 16, color: { rgb: COLORS.white } },
  fill: { fgColor: { rgb: COLORS.navy } },
  alignment: { horizontal: 'left', vertical: 'center' },
}

const subtitleStyle: XLSX.CellObject['s'] = {
  font: { bold: true, sz: 12, color: { rgb: COLORS.white } },
  fill: { fgColor: { rgb: COLORS.surface } },
  alignment: { horizontal: 'left', vertical: 'center' },
}

const metaStyle: XLSX.CellObject['s'] = {
  font: { sz: 10, color: { rgb: '475569' } },
  alignment: { horizontal: 'left', vertical: 'center' },
}

const sectionStyle: XLSX.CellObject['s'] = {
  font: { bold: true, sz: 11, color: { rgb: COLORS.white } },
  fill: { fgColor: { rgb: COLORS.surface } },
  alignment: { horizontal: 'left', vertical: 'center' },
}

const headerStyle: XLSX.CellObject['s'] = {
  font: { bold: true, sz: 10, color: { rgb: COLORS.white } },
  fill: { fgColor: { rgb: COLORS.navy } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
}

function bodyStyle(isAlt: boolean, align: 'left' | 'center' | 'right' = 'left'): XLSX.CellObject['s'] {
  return {
    font: { sz: 10, color: { rgb: '1E293B' } },
    fill: { fgColor: { rgb: isAlt ? COLORS.rowAlt : COLORS.white } },
    alignment: { horizontal: align, vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.border } },
      bottom: { style: 'thin', color: { rgb: COLORS.border } },
      left: { style: 'thin', color: { rgb: COLORS.border } },
      right: { style: 'thin', color: { rgb: COLORS.border } },
    },
  }
}

const totalStyle: XLSX.CellObject['s'] = {
  font: { bold: true, sz: 10, color: { rgb: COLORS.white } },
  fill: { fgColor: { rgb: COLORS.accent } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } },
  },
}

const totalLabelStyle: XLSX.CellObject['s'] = {
  ...totalStyle,
  alignment: { horizontal: 'right', vertical: 'center' },
}

function setCols(sheet: XLSX.WorkSheet, widths: number[]): void {
  sheet['!cols'] = widths.map((wch) => ({ wch }))
}

function buildSummarySheet(ctx: ExportContext, tableNames: string[]): XLSX.WorkSheet {
  const sheet: XLSX.WorkSheet = {}
  const lastCol = 'F'

  setCell(sheet, 0, 0, 'Dashboard Superintendência Stüpp', titleStyle)
  merge(sheet, 'A1', `${lastCol}1`)

  setCell(sheet, 1, 0, ctx.pageTitle, subtitleStyle)
  merge(sheet, 'A2', `${lastCol}2`)

  setCell(sheet, 2, 0, `Exportado em ${ctx.exportedAt}`, metaStyle)
  merge(sheet, 'A3', `${lastCol}3`)

  setCell(sheet, 4, 0, 'Filtros aplicados', sectionStyle)
  merge(sheet, 'A5', `${lastCol}5`)

  const filters: [string, string][] = [
    ['Período', ctx.filterLabels.periodo],
    ['Esteira', ctx.filterLabels.esteira],
    ['Diretoria', ctx.filterLabels.diretoria],
    ['Equipe', ctx.filterLabels.equipe],
    ['Roleta', ctx.filterLabels.roleta],
  ]

  filters.forEach(([label, value], i) => {
    const r = 5 + i
    setCell(sheet, r, 0, label, bodyStyle(i % 2 === 1, 'left'))
    setCell(sheet, r, 1, value, bodyStyle(i % 2 === 1, 'left'))
    merge(sheet, `B${r + 1}`, `${lastCol}${r + 1}`)
  })

  let row = 11
  setCell(sheet, row, 0, 'Indicadores principais', sectionStyle)
  merge(sheet, `A${row + 1}`, `${lastCol}${row + 1}`)
  row++

  const kpis: { label: string; value: number }[] =
    ctx.esteira === 'TODAS'
      ? [
          { label: 'Total de leads', value: ctx.data.totalLeads },
          { label: 'Comercial Econômico', value: ctx.data.economicoCount },
          { label: 'Comercial Geral', value: ctx.data.geralCount },
        ]
      : ctx.esteira === 'GERAL'
        ? [{ label: 'Comercial Geral', value: ctx.data.geralCount }]
        : [{ label: 'Comercial Econômico', value: ctx.data.economicoCount }]

  setCell(sheet, row, 0, 'Indicador', headerStyle)
  setCell(sheet, row, 1, 'Valor', headerStyle)
  merge(sheet, `B${row + 1}`, `${lastCol}${row + 1}`)
  row++

  filterNonZeroRows(kpis).forEach((kpi, i) => {
    setCell(sheet, row, 0, kpi.label, bodyStyle(i % 2 === 1))
    setCell(sheet, row, 1, kpi.value, bodyStyle(i % 2 === 1, 'right'))
    merge(sheet, `B${row + 1}`, `${lastCol}${row + 1}`)
    row++
  })

  row += 1
  setCell(sheet, row, 0, 'Abas do relatório', sectionStyle)
  merge(sheet, `A${row + 1}`, `${lastCol}${row + 1}`)
  row++

  setCell(sheet, row, 0, '#', headerStyle)
  setCell(sheet, row, 1, 'Seção', headerStyle)
  setCell(sheet, row, 2, 'Registros', headerStyle)
  merge(sheet, `C${row + 1}`, `${lastCol}${row + 1}`)
  row++

  tableNames.forEach((name, i) => {
    setCell(sheet, row, 0, i + 1, bodyStyle(i % 2 === 1, 'center'))
    setCell(sheet, row, 1, name, bodyStyle(i % 2 === 1))
    setCell(sheet, row, 2, 'Ver aba', bodyStyle(i % 2 === 1, 'center'))
    merge(sheet, `C${row + 1}`, `${lastCol}${row + 1}`)
    row++
  })

  setCell(sheet, row + 1, 0, 'HubON © 2026 — Relatório gerado automaticamente pelo Dashboard Stüpp', metaStyle)
  merge(sheet, `A${row + 2}`, `${lastCol}${row + 2}`)

  sheet['!ref'] = `A1:${lastCol}${row + 2}`
  setCols(sheet, [22, 28, 14, 14, 14, 14])
  sheet['!views'] = [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }]

  return sheet
}

function buildDataSheet(ctx: ExportContext, section: TableSection): XLSX.WorkSheet {
  const sheet: XLSX.WorkSheet = {}
  const lastCol = 'E'
  const rows = filterNonZeroRows(section.rows)
  const total = rows.reduce((sum, row) => sum + row.value, 0)

  setCell(sheet, 0, 0, section.title, titleStyle)
  merge(sheet, 'A1', `${lastCol}1`)

  setCell(sheet, 1, 0, `Período: ${ctx.filterLabels.periodo}`, metaStyle)
  merge(sheet, 'A2', `${lastCol}2`)
  setCell(sheet, 2, 0, `Exportado em ${ctx.exportedAt}`, metaStyle)
  merge(sheet, 'A3', `${lastCol}3`)

  const headerRow = 4
  setCell(sheet, headerRow, 0, '#', headerStyle)
  setCell(sheet, headerRow, 1, section.labelHeader, headerStyle)
  setCell(sheet, headerRow, 2, section.valueHeader, headerStyle)
  setCell(sheet, headerRow, 3, '% do total', headerStyle)
  setCell(sheet, headerRow, 4, 'Participação', headerStyle)

  rows.forEach((row, i) => {
    const r = headerRow + 1 + i
    const pct = total > 0 ? row.value / total : 0
    setCell(sheet, r, 0, i + 1, bodyStyle(i % 2 === 1, 'center'))
    setCell(sheet, r, 1, row.label, bodyStyle(i % 2 === 1))
    setCell(sheet, r, 2, row.value, bodyStyle(i % 2 === 1, 'right'))
    const pctCell = sheet[encode(r, 3)] ?? { v: pct, t: 'n' }
    pctCell.v = pct
    pctCell.t = 'n'
    pctCell.z = '0.0%'
    pctCell.s = bodyStyle(i % 2 === 1, 'center')
    sheet[encode(r, 3)] = pctCell
    const barCell = sheet[encode(r, 4)] ?? { v: Math.round(pct * 100), t: 'n' }
    barCell.v = Math.round(pct * 100)
    barCell.t = 'n'
    barCell.s = bodyStyle(i % 2 === 1, 'center')
    sheet[encode(r, 4)] = barCell
  })

  const totalRow = headerRow + 1 + rows.length
  setCell(sheet, totalRow, 0, '', totalLabelStyle)
  setCell(sheet, totalRow, 1, 'TOTAL', totalLabelStyle)
  setCell(sheet, totalRow, 2, total, totalStyle)
  setCell(sheet, totalRow, 3, total > 0 ? 1 : 0, totalStyle)
  sheet[encode(totalRow, 3)].z = '0.0%'
  setCell(sheet, totalRow, 4, total > 0 ? 100 : 0, totalStyle)

  sheet['!ref'] = `A1:${lastCol}${totalRow + 1}`
  setCols(sheet, [6, 36, 14, 14, 14])

  if (rows.length > 0) {
    sheet['!autofilter'] = {
      ref: `A${headerRow + 1}:${lastCol}${totalRow}`,
    }
    sheet['!views'] = [{ state: 'frozen', ySplit: headerRow + 1, activeCell: 'B6' }]
  }

  return sheet
}

function buildEvolutionSheet(ctx: ExportContext): XLSX.WorkSheet | null {
  const sheet: XLSX.WorkSheet = {}
  const isTodas = ctx.esteira === 'TODAS'
  const isGeral = ctx.esteira === 'GERAL'
  const lastCol = isTodas ? 'E' : 'D'

  const rows = ctx.data.overTime.filter((row) => {
    if (isTodas) return row.economico !== 0 || row.geral !== 0
    if (isGeral) return row.geral !== 0
    return row.economico !== 0
  })

  if (rows.length === 0) return null

  setCell(sheet, 0, 0, 'Evolução no período', titleStyle)
  merge(sheet, 'A1', `${lastCol}1`)
  setCell(sheet, 1, 0, `Período: ${ctx.filterLabels.periodo}`, metaStyle)
  merge(sheet, 'A2', `${lastCol}2`)
  setCell(sheet, 2, 0, `Exportado em ${ctx.exportedAt}`, metaStyle)
  merge(sheet, 'A3', `${lastCol}3`)

  const headerRow = 4
  setCell(sheet, headerRow, 0, 'Data', headerStyle)
  if (isTodas) {
    setCell(sheet, headerRow, 1, 'Comercial Econômico', headerStyle)
    setCell(sheet, headerRow, 2, 'Comercial Geral', headerStyle)
    setCell(sheet, headerRow, 3, 'Total do dia', headerStyle)
    setCell(sheet, headerRow, 4, 'Variação', headerStyle)
  } else if (isGeral) {
    setCell(sheet, headerRow, 1, 'Comercial Geral', headerStyle)
    setCell(sheet, headerRow, 2, 'Acumulado', headerStyle)
    setCell(sheet, headerRow, 3, 'Variação', headerStyle)
  } else {
    setCell(sheet, headerRow, 1, 'Comercial Econômico', headerStyle)
    setCell(sheet, headerRow, 2, 'Acumulado', headerStyle)
    setCell(sheet, headerRow, 3, 'Variação', headerStyle)
  }

  let cumulative = 0
  let prevDayTotal = 0

  rows.forEach((row, i) => {
    const r = headerRow + 1 + i
    const dayTotal = isTodas ? row.economico + row.geral : isGeral ? row.geral : row.economico
    cumulative += dayTotal
    const variation = i === 0 ? dayTotal : dayTotal - prevDayTotal
    prevDayTotal = dayTotal

    setCell(sheet, r, 0, row.date, bodyStyle(i % 2 === 1))
    if (isTodas) {
      setCell(sheet, r, 1, row.economico, bodyStyle(i % 2 === 1, 'right'))
      setCell(sheet, r, 2, row.geral, bodyStyle(i % 2 === 1, 'right'))
      setCell(sheet, r, 3, dayTotal, bodyStyle(i % 2 === 1, 'right'))
      setCell(sheet, r, 4, variation, bodyStyle(i % 2 === 1, 'right'))
    } else if (isGeral) {
      setCell(sheet, r, 1, row.geral, bodyStyle(i % 2 === 1, 'right'))
      setCell(sheet, r, 2, cumulative, bodyStyle(i % 2 === 1, 'right'))
      setCell(sheet, r, 3, variation, bodyStyle(i % 2 === 1, 'right'))
    } else {
      setCell(sheet, r, 1, row.economico, bodyStyle(i % 2 === 1, 'right'))
      setCell(sheet, r, 2, cumulative, bodyStyle(i % 2 === 1, 'right'))
      setCell(sheet, r, 3, variation, bodyStyle(i % 2 === 1, 'right'))
    }
  })

  const totalRow = headerRow + 1 + rows.length
  setCell(sheet, totalRow, 0, 'TOTAL', totalLabelStyle)
  if (isTodas) {
    const totalEco = rows.reduce((s, r) => s + r.economico, 0)
    const totalGer = rows.reduce((s, r) => s + r.geral, 0)
    setCell(sheet, totalRow, 1, totalEco, totalStyle)
    setCell(sheet, totalRow, 2, totalGer, totalStyle)
    setCell(sheet, totalRow, 3, totalEco + totalGer, totalStyle)
    setCell(sheet, totalRow, 4, '', totalStyle)
  } else if (isGeral) {
    const total = rows.reduce((s, r) => s + r.geral, 0)
    setCell(sheet, totalRow, 1, total, totalStyle)
    setCell(sheet, totalRow, 2, total, totalStyle)
    setCell(sheet, totalRow, 3, '', totalStyle)
  } else {
    const total = rows.reduce((s, r) => s + r.economico, 0)
    setCell(sheet, totalRow, 1, total, totalStyle)
    setCell(sheet, totalRow, 2, total, totalStyle)
    setCell(sheet, totalRow, 3, '', totalStyle)
  }

  sheet['!ref'] = `A1:${lastCol}${totalRow + 1}`
  setCols(sheet, isTodas ? [12, 18, 18, 14, 12] : [12, 18, 14, 12])
  sheet['!autofilter'] = { ref: `A${headerRow + 1}:${lastCol}${totalRow - 1}` }
  sheet['!views'] = [{ state: 'frozen', ySplit: headerRow + 1, activeCell: 'A6' }]

  return sheet
}

function buildLeadDetailsSheet(ctx: ExportContext): XLSX.WorkSheet | null {
  const leads = ctx.data.leadDetails ?? []
  if (leads.length === 0) return null

  const sheet: XLSX.WorkSheet = {}
  const lastCol = 'K'
  const headers = [
    'ID',
    'Negociação',
    'Esteira',
    'Fase',
    'Corretor',
    'Diretoria',
    'Equipe',
    'Roleta',
    'Origem',
    'Data entrada',
    'Tempo na esteira',
  ]

  setCell(sheet, 0, 0, 'Detalhamento de leads', titleStyle)
  merge(sheet, 'A1', `${lastCol}1`)
  setCell(
    sheet,
    1,
    0,
    'Tempo na esteira = desde a data de entrada no corretor',
    metaStyle
  )
  merge(sheet, 'A2', `${lastCol}2`)
  setCell(sheet, 2, 0, `Exportado em ${ctx.exportedAt}`, metaStyle)
  merge(sheet, 'A3', `${lastCol}3`)

  const headerRow = 4
  headers.forEach((header, col) => {
    setCell(sheet, headerRow, col, header, headerStyle)
  })

  leads.forEach((lead, i) => {
    const r = headerRow + 1 + i
    const values: (string | number)[] = [
      lead.id,
      lead.title,
      lead.esteira,
      lead.stage,
      lead.corretor,
      lead.diretoria,
      lead.equipe,
      lead.roleta,
      lead.origem,
      lead.dateCreate,
      lead.tempoNaEsteira,
    ]
    values.forEach((value, col) => {
      const align = col === 0 ? 'center' : 'left'
      setCell(sheet, r, col, value, bodyStyle(i % 2 === 1, align))
    })
  })

  const totalRow = headerRow + 1 + leads.length
  setCell(sheet, totalRow, 0, 'TOTAL', totalLabelStyle)
  setCell(sheet, totalRow, 1, `${leads.length} lead(s)`, totalStyle)
  for (let col = 2; col <= 10; col++) {
    setCell(sheet, totalRow, col, '', totalStyle)
  }

  sheet['!ref'] = `A1:${lastCol}${totalRow + 1}`
  setCols(sheet, [8, 32, 16, 18, 20, 16, 16, 14, 16, 18, 16])
  sheet['!autofilter'] = { ref: `A${headerRow + 1}:${lastCol}${totalRow - 1}` }
  sheet['!views'] = [{ state: 'frozen', ySplit: headerRow + 1, activeCell: 'B6' }]

  return sheet
}

function collectTableSections(ctx: ExportContext): TableSection[] {
  const sections: TableSection[] = [
    {
      title: 'Leads por diretoria',
      labelHeader: 'Diretoria',
      valueHeader: 'Leads',
      rows: ctx.data.byDiretoria.map((r) => ({ label: r.name, value: r.leads })),
    },
    {
      title: 'Leads por equipe',
      labelHeader: 'Equipe',
      valueHeader: 'Leads',
      rows: ctx.data.byTeam.map((r) => ({ label: r.equipe, value: r.leads })),
    },
    {
      title: 'Leads por fase',
      labelHeader: 'Fase',
      valueHeader: 'Leads',
      rows: ctx.data.byStage.map((r) => ({ label: r.stage, value: r.count })),
    },
    {
      title: 'Leads por origem (fonte)',
      labelHeader: 'Origem',
      valueHeader: 'Leads',
      rows: ctx.data.bySource.map((r) => ({ label: r.source, value: r.count })),
    },
  ]

  if (ctx.esteira === 'TODAS' || ctx.esteira === 'ECONOMICO') {
    sections.push({
      title: 'Funil — Comercial Econômico',
      labelHeader: 'Etapa',
      valueHeader: 'Leads',
      rows: ctx.data.funnelEconomico.map((r) => ({ label: r.x, value: r.y })),
    })
  }

  if (ctx.esteira === 'TODAS' || ctx.esteira === 'GERAL') {
    sections.push({
      title: 'Funil — Comercial Geral',
      labelHeader: 'Etapa',
      valueHeader: 'Leads',
      rows: ctx.data.funnelGeral.map((r) => ({ label: r.x, value: r.y })),
    })
  }

  return sections.filter((s) => filterNonZeroRows(s.rows).length > 0)
}

function sheetTabName(title: string): string {
  return title
    .replace(/[\\/?*[\]]/g, '')
    .slice(0, 31)
}

export function buildExcelWorkbook(ctx: ExportContext): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  const tableSections = collectTableSections(ctx)
  const tabNames = tableSections.map((s) => sheetTabName(s.title))

  const evolution = buildEvolutionSheet(ctx)
  const leadDetails = buildLeadDetailsSheet(ctx)

  const sheetOrder: string[] = []
  if (evolution) sheetOrder.push('Evolução')
  if (leadDetails) sheetOrder.push('Detalhamento')
  sheetOrder.push(...tabNames)

  XLSX.utils.book_append_sheet(workbook, buildSummarySheet(ctx, sheetOrder), 'Resumo')

  if (evolution) {
    XLSX.utils.book_append_sheet(workbook, evolution, 'Evolução')
  }

  if (leadDetails) {
    XLSX.utils.book_append_sheet(workbook, leadDetails, 'Detalhamento')
  }

  for (const section of tableSections) {
    XLSX.utils.book_append_sheet(workbook, buildDataSheet(ctx, section), sheetTabName(section.title))
  }

  return workbook
}

export function writeExcelFile(ctx: ExportContext, filename: string): void {
  const workbook = buildExcelWorkbook(ctx)
  XLSX.writeFile(workbook, filename)
}
