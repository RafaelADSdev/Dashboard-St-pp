'use client'

import { useFilterStore } from '@/store/filterStore'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { DiretoriaFilter } from '@/components/filters/DiretoriaFilter'
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
import { ErrorState, LoadingState } from '@/components/ui/StatusMessage'

export function EsteiraGeralPage() {
  const filters = useFilterStore()
  const { data, isLoading, isError } = useLeadsData({ ...filters, esteira: 'GERAL' })

  if (isLoading) {
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
        badge="Comercial Geral"
        title="Esteira Comercial Geral"
        subtitle="Negociações da superintendência Stüpp na esteira geral."
      />

      <FilterPanel>
        <DateRangeFilter />
        <DiretoriaFilter />
        <EquipeFilter />
      </FilterPanel>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <KPICard label="Total no período" value={data?.totalLeads ?? 0} color="brand" />
        <KPICard label="Comercial Geral" value={data?.geralCount ?? 0} color="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Funil da esteira" description="Distribuição por etapa">
          <PipelineFunnelChart data={data?.funnelGeral ?? []} />
        </ChartCard>
        <ChartCard title="Evolução no período" description="Leads ao longo do tempo">
          <LeadsOverTimeChart data={data?.overTime ?? []} />
        </ChartCard>
      </div>

      <ChartCard title="Leads por fase" description="Detalhamento por estágio do CRM">
        <LeadsByStageChart data={data?.byStage ?? []} />
      </ChartCard>
    </PageShell>
  )
}
