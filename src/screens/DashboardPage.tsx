'use client'

import { useMemo } from 'react'
import { useAppliedFilters } from '@/store/filterStore'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { EsteiraFilter } from '@/components/filters/EsteiraFilter'
import { DiretoriaFilter } from '@/components/filters/DiretoriaFilter'
import { EquipeFilter } from '@/components/filters/EquipeFilter'
import { CorretorFilter } from '@/components/filters/CorretorFilter'
import { RoletaFilter } from '@/components/filters/RoletaFilter'
import { LeadsByTeamPanel } from '@/components/charts/LeadsByTeamPanel'
import { LeadsBySourceChart } from '@/components/charts/LeadsBySourceChart'
import { LeadsOverTimeChart } from '@/components/charts/LeadsOverTimeChart'
import { PipelineFunnelChart } from '@/components/charts/PipelineFunnelChart'
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
  formatFunnelBottleneckDescription,
  getFunnelBottleneck,
  getLostLeadsKpiAlert,
  KPI_HINT_ALERT_CLASSES,
  KPI_VALUE_ALERT_CLASSES,
} from '@/utils/operationalAlert'

function DashboardFilters() {
  return (
    <FilterPanel>
      <DateRangeFilter />
      <EsteiraFilter />
      <DiretoriaFilter />
      <EquipeFilter />
      <CorretorFilter />
      <RoletaFilter />
    </FilterPanel>
  )
}

export function DashboardPage() {
  const applied = useAppliedFilters()
  const { data, isFetching, isPending, isError, error } = useLeadsData(
    applied,
    undefined,
    'overview'
  )
  const isApplyingFilters = useFilterApplyFeedback(isFetching || isPending)
  const diretoriaSelected = Boolean(applied?.diretoria)

  const lostLeadsAlert = useMemo(
    () => getLostLeadsKpiAlert(data?.leadsPerdidos ?? 0, data?.totalLeads ?? 0),
    [data?.leadsPerdidos, data?.totalLeads]
  )

  const funnelEconomicoBottleneck = useMemo(
    () => getFunnelBottleneck(data?.funnelEconomico ?? []),
    [data?.funnelEconomico]
  )

  const funnelGeralBottleneck = useMemo(
    () => getFunnelBottleneck(data?.funnelGeral ?? []),
    [data?.funnelGeral]
  )

  return (
    <>
      <DashboardFilters />

      <PageShell>
        {isError ? (
          <ErrorState title="Erro ao carregar dados do Bitrix">
            {(error as Error)?.message?.includes('pausada temporariamente')
              ? 'A integração com o Bitrix está pausada para reduzir carga no webhook. Tente novamente mais tarde.'
              : (error as Error)?.message?.includes('operation time limit')
                ? 'O Bitrix bloqueou consultas de negociações (limite de operação). Aguarde 15–30 minutos sem usar o dashboard ou ative BITRIX_PAUSED=true na Vercel.'
                : 'Verifique o webhook no arquivo .env'}
          </ErrorState>
        ) : !data && (isFetching || isPending) ? (
          <LoadingState message="Carregando leads da Superintendência Stüpp..." />
        ) : (
          <>
            <PageHeader
              badge="Superintendência Stüpp"
              title="Visão geral comercial"
              subtitle="Leads por data de entrada no corretor. Use Hoje + equipe para ver a chegada do dia."
            />

            <FilterApplyingOverlay isActive={isApplyingFilters}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <KPICard label="Leads recebidos" value={data?.totalLeads ?? 0} color="brand" />
                  <KPICard
                    label="Leads perdidos"
                    value={data?.leadsPerdidos ?? 0}
                    color="indigo"
                    alertLevel={lostLeadsAlert.level}
                    valueClassName={KPI_VALUE_ALERT_CLASSES[lostLeadsAlert.level]}
                    secondaryHint={lostLeadsAlert.hint}
                    secondaryHintClassName={KPI_HINT_ALERT_CLASSES[lostLeadsAlert.level]}
                  />
                  <KPICard
                    label="Corretores ativos roleta"
                    value={data?.corretoresAtivosRoleta ?? 0}
                    color="emerald"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <ChartCard
                    title={diretoriaSelected ? 'Leads por equipe' : 'Leads por diretoria'}
                    description={
                      diretoriaSelected
                        ? 'Volume por equipe da diretoria selecionada no período'
                        : 'Volume por diretoria no período'
                    }
                  >
                    <LeadsByTeamPanel
                      byDiretoria={diretoriaSelected ? undefined : data?.byDiretoria}
                      byTeam={diretoriaSelected ? data?.byTeam : undefined}
                    />
                  </ChartCard>
                  <ChartCard title="Evolução no período" description="Comparativo diário entre esteiras">
                    <LeadsOverTimeChart data={data?.overTime ?? []} />
                  </ChartCard>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <ChartCard
                    title="Funil — Comercial Econômico"
                    description={formatFunnelBottleneckDescription(
                      funnelEconomicoBottleneck,
                      'Etapas do pipeline econômico'
                    )}
                    descriptionClassName={
                      funnelEconomicoBottleneck && funnelEconomicoBottleneck.level !== 'ok'
                        ? `font-semibold ${KPI_HINT_ALERT_CLASSES[funnelEconomicoBottleneck.level]}`
                        : undefined
                    }
                  >
                    <PipelineFunnelChart data={data?.funnelEconomico ?? []} />
                  </ChartCard>
                  <ChartCard
                    title="Funil — Comercial Geral"
                    description={formatFunnelBottleneckDescription(
                      funnelGeralBottleneck,
                      'Etapas do pipeline geral'
                    )}
                    descriptionClassName={
                      funnelGeralBottleneck && funnelGeralBottleneck.level !== 'ok'
                        ? `font-semibold ${KPI_HINT_ALERT_CLASSES[funnelGeralBottleneck.level]}`
                        : undefined
                    }
                  >
                    <PipelineFunnelChart data={data?.funnelGeral ?? []} />
                  </ChartCard>
                </div>

                <ChartCard
                  title="Leads por origem e roleta"
                  description="Veja de qual fonte veio o lead e em qual roleta ele entrou no período"
                >
                  <LeadsBySourceChart
                    bySource={data?.bySource ?? []}
                    byRoleta={data?.byRoleta ?? []}
                  />
                </ChartCard>
              </div>
            </FilterApplyingOverlay>
          </>
        )}
      </PageShell>
    </>
  )
}
