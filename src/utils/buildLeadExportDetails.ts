import {
  ESTEIRA_ECONOMICO_NAME,
  ESTEIRA_GERAL_NAME,
  isEconomicoCategory,
} from '@/api/bitrixConfig'
import { resolveStageLabel, type StageCatalog } from '@/api/bitrixStages'
import type { BitrixLead, ExportLeadDetail } from '@/api/types'
import { computeDuration, formatBitrixDateDisplay } from '@/utils/leadTiming'

export function buildLeadExportDetails(
  leads: BitrixLead[],
  stageCatalog: StageCatalog,
  sourceLabels: Record<string, string>,
  reference = new Date()
): ExportLeadDetail[] {
  return leads
    .map((lead) => {
      const entryDate = lead.date_arrived || lead.date_create
      const tempoNaEsteira = computeDuration(entryDate, reference)

      return {
        id: lead.id,
        title: lead.title,
        esteira: isEconomicoCategory(lead.category_id)
          ? ESTEIRA_ECONOMICO_NAME
          : ESTEIRA_GERAL_NAME,
        stage: resolveStageLabel(lead.stage_id, stageCatalog.labels, lead.category_id),
        corretor: lead.assigned_by_name,
        diretoria: lead.diretoria,
        equipe: lead.equipe,
        roleta: lead.roleta || '—',
        origem: lead.source_id
          ? (sourceLabels[lead.source_id] ?? lead.source_id)
          : 'Sem origem',
        dateCreateIso: entryDate,
        dateModifyIso: entryDate,
        dateCreate: formatBitrixDateDisplay(entryDate),
        daysInPipeline: tempoNaEsteira.days,
        tempoNaEsteira: tempoNaEsteira.label,
        dateModify: formatBitrixDateDisplay(entryDate),
        daysWithoutUpdate: tempoNaEsteira.days,
        tempoSemAtualizar: tempoNaEsteira.label,
      }
    })
    .sort(
      (a, b) =>
        b.daysInPipeline - a.daysInPipeline ||
        a.title.localeCompare(b.title, 'pt-BR')
    )
}
