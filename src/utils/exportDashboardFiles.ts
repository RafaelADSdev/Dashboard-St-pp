import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  buildExportFilename,
  getPdfSections,
  type ExportContext,
} from './exportDashboard'
import { writeExcelFile } from './excel/buildExcelWorkbook'

export async function exportDashboardExcel(ctx: ExportContext): Promise<void> {
  writeExcelFile(ctx, buildExportFilename(ctx, 'xlsx'))
}

export async function exportDashboardPdf(ctx: ExportContext): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.text('Dashboard Superintendência Stüpp', 14, 18)

  doc.setFontSize(11)
  doc.text(ctx.pageTitle, 14, 26)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Exportado em ${ctx.exportedAt}`, 14, 32)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 38,
    head: [['Filtro', 'Valor']],
    body: [
      ['Período', ctx.filterLabels.periodo],
      ['Esteira', ctx.filterLabels.esteira],
      ['Diretoria', ctx.filterLabels.diretoria],
      ['Equipe', ctx.filterLabels.equipe],
      ['Roleta', ctx.filterLabels.roleta],
    ],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 58, 138] },
    margin: { left: 14, right: 14 },
    tableWidth: pageWidth - 28,
  })

  let cursorY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 50

  for (const section of getPdfSections(ctx)) {
    if (section.body.length === 0) continue

    const neededHeight = 18 + section.body.length * 6
    if (cursorY + neededHeight > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage()
      cursorY = 18
    }

    doc.setFontSize(11)
    doc.setTextColor(30, 58, 138)
    doc.text(section.title, 14, cursorY + 6)
    doc.setTextColor(0)

    autoTable(doc, {
      startY: cursorY + 10,
      head: [section.head],
      body: section.body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138] },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
    })

    cursorY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY + 20
    cursorY += 8
  }

  doc.save(buildExportFilename(ctx, 'pdf'))
}
