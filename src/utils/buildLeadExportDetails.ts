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
      const tempoNaEsteira = computeDuration(lead.date_create, reference)
      const lastActivity = lead.date_last_movement || lead.date_modify || lead.date_create
      const tempoSemAtualizar = computeDuration(lastActivity, reference)

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
        dateCreateIso: lead.date_create,
        dateModifyIso: lastActivity,
        dateCreate: formatBitrixDateDisplay(lead.date_create),
        daysInPipeline: tempoNaEsteira.days,
        tempoNaEsteira: tempoNaEsteira.label,
        dateModify: formatBitrixDateDisplay(lead.date_modify),
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
