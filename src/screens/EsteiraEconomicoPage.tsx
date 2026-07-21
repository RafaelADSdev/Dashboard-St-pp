'use client'

import { useAppliedFilters } from '@/store/filterStore'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { DiretoriaFilter } from '@/components/filters/DiretoriaFilter'
import { EquipeFilter } from '@/components/filters/EquipeFilter'
import { RoletaFilter } from '@/components/filters/RoletaFilter'
import { PipelineFunnelChart } from '@/components/charts/PipelineFunnelChart'
import { LeadsKanbanBoard } from '@/components/kanban/LeadsKanbanBoard'
import { LeadsBySourceChart } from '@/components/charts/LeadsBySourceChart'
import { LeadsOverTimeChart } from '@/components/charts/LeadsOverTimeChart'
import { KPICard } from '@/components/cards/KPICard'
import { useLeadsData } from '@/hooks/useLeadsData'
import { PageShell } from '@/components/ui/PageShell'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterPanel } from '@/components/ui/FilterPanel'
import { ChartCard } from '@/components/ui/ChartCard'
import { FilterApplyingOverlay } from '@/components/ui/FilterApplyingOverlay'
import { ErrorState, LoadingState } from '@/components/ui/StatusMessage'
import { useFilterApplyFeedback } from '@/hooks/useFilterApplyFeedback'
import {
  countKanbanAlerts,
  getKanbanBoardsAlertLevel,
  KPI_HINT_ALERT_CLASSES,
  KPI_VALUE_ALERT_CLASSES,
} from '@/utils/operationalAlert'
import { useMemo } from 'react'

function EsteiraEconomicoFilters() {
  return (
    <FilterPanel ignoreEsteira>
      <DateRangeFilter />
      <DiretoriaFilter />
      <EquipeFilter />
      <RoletaFilter />
    </FilterPanel>
  )
}

export function EsteiraEconomicoPage() {
  const applied = useAppliedFilters()
  const { data, isLoading, isFetching, isPending, isError } = useLeadsData(applied, { esteira: 'ECONOMICO' })
  const isApplyingFilters = useFilterApplyFeedback(isFetching || isPending)
  const alertCount = useMemo(
    () => countKanbanAlerts(data?.kanbanBoards ?? []),
    [data?.kanbanBoards]
  )
  const kanbanAlertLevel = useMemo(
    () => getKanbanBoardsAlertLevel(data?.kanbanBoards ?? []),
    [data?.kanbanBoards]
  )

  return (
    <>
      <EsteiraEconomicoFilters />

      <PageShell>
        {isLoading && !data ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState />
        ) : (
          <>
            <PageHeader
              badge="Comercial Econômico"
              title="Esteira Comercial Econômico"
              subtitle="Negociações da superintendência Stüpp na esteira econômica."
            />

            <FilterApplyingOverlay isActive={isApplyingFilters}>
              <div className="space-y-5">
                <div className="max-w-sm">
                  <KPICard
                    label="Comercial Econômico"
                    value={data?.economicoCount ?? 0}
                    color="indigo"
                    alertLevel={kanbanAlertLevel}
                    valueClassName={KPI_VALUE_ALERT_CLASSES[kanbanAlertLevel]}
                    secondaryHint={alertCount > 0 ? `· ${alertCount} em alerta` : undefined}
                    secondaryHintClassName={KPI_HINT_ALERT_CLASSES[kanbanAlertLevel]}
                  />
                </div>

                <ChartCard
                  title="Kanban — Comercial Econômico"
                  description="Clique no card para ver detalhes · Arraste para mudar a fase"
                  className="overflow-hidden"
                >
                  <LeadsKanbanBoard boards={data?.kanbanBoards ?? []} expanded />
                </ChartCard>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <ChartCard title="Funil da esteira" description="Distribuição por etapa">
                    <PipelineFunnelChart data={data?.funnelEconomico ?? []} />
                  </ChartCard>
                  <ChartCard title="Evolução no período" description="Leads ao longo do tempo">
                    <LeadsOverTimeChart data={data?.overTime ?? []} esteira="economico" />
                  </ChartCard>
                </div>

                <ChartCard
                  title="Leads por roleta"
                  description="Volume por roleta Stüpp no período — passe o mouse para ver ativos e perdidos"
                >
                  <LeadsBySourceChart byRoleta={data?.byRoleta ?? []} />
                </ChartCard>
              </div>
            </FilterApplyingOverlay>
          </>
        )}
      </PageShell>
    </>
  )
}
