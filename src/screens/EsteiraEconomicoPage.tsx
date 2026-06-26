'use client'

import { useAppliedFilters } from '@/store/filterStore'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { DiretoriaFilter } from '@/components/filters/DiretoriaFilter'
import { ApplyFiltersButton } from '@/components/filters/ApplyFiltersButton'
import { EquipeFilter } from '@/components/filters/EquipeFilter'
import { PipelineFunnelChart } from '@/components/charts/PipelineFunnelChart'
import { LeadsByStageChart } from '@/components/charts/LeadsByStageChart'
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

export function EsteiraEconomicoPage() {
  const applied = useAppliedFilters()
  const { data, isLoading, isFetching, isError } = useLeadsData(applied, { esteira: 'ECONOMICO' })
  const isApplyingFilters = useFilterApplyFeedback(isFetching)

  if (isLoading && !data) {
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    )
  }

  if (isError) {
    return (
      <PageShell>
        <ErrorState />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        badge="Comercial Econômico"
        title="Esteira Comercial Econômico"
        subtitle="Negociações da superintendência Stüpp na esteira econômica."
      />

      <FilterPanel>
        <DateRangeFilter />
        <DiretoriaFilter />
        <EquipeFilter />
        <ApplyFiltersButton ignoreEsteira />
      </FilterPanel>

      <FilterApplyingOverlay isActive={isApplyingFilters}>
        <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <KPICard label="Total no período" value={data?.totalLeads ?? 0} color="brand" />
        <KPICard label="Comercial Econômico" value={data?.economicoCount ?? 0} color="indigo" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Funil da esteira" description="Distribuição por etapa">
          <PipelineFunnelChart data={data?.funnelEconomico ?? []} />
        </ChartCard>
        <ChartCard title="Evolução no período" description="Leads ao longo do tempo">
          <LeadsOverTimeChart data={data?.overTime ?? []} />
        </ChartCard>
      </div>

      <ChartCard title="Leads por fase" description="Detalhamento por estágio do CRM">
        <LeadsByStageChart data={data?.byStage ?? []} />
      </ChartCard>
        </div>
      </FilterApplyingOverlay>
    </PageShell>
  )
}
