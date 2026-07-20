'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { getRankingBarColor, getStageChartColor } from '@/lib/stageColors'
import { useChartTheme } from '@/hooks/useChartTheme'
import {
  FUNNEL_BOTTLENECK_COLORS,
  getFunnelBottleneck,
  type FunnelBottleneck,
} from '@/utils/operationalAlert'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface Props {
  data: { x: string; y: number }[]
  highlightBottleneck?: boolean
}

export function PipelineFunnelChart({ data, highlightBottleneck = true }: Props) {
  const chart = useChartTheme()

  const chartData = useMemo(() => data.filter((item) => item.y > 0), [data])
  const bottleneck = useMemo(
    () => (highlightBottleneck ? getFunnelBottleneck(data) : null),
    [data, highlightBottleneck]
  )

  const barColors = useMemo(() => {
    if (!bottleneck || bottleneck.level === 'ok') {
      return chartData.map((item) => {
        const sourceIndex = data.findIndex((stage) => stage.x === item.x)
        return getStageChartColor(sourceIndex >= 0 ? sourceIndex : 0)
      })
    }

    return chartData.map((item) => {
      if (item.x === bottleneck.stageName) {
        return FUNNEL_BOTTLENECK_COLORS[bottleneck.level]
      }
      const sourceIndex = data.findIndex((stage) => stage.x === item.x)
      return getStageChartColor(sourceIndex >= 0 ? sourceIndex : 0)
    })
  }, [bottleneck, chartData, data])

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-indigo/50 dark:text-cream/45">
        Nenhum dado no período selecionado
      </div>
    )
  }

  const chartHeight = Math.max(220, chartData.length * 48)

  return (
    <ReactApexChart
      type="bar"
      height={chartHeight}
      options={{
        chart: {
          type: 'bar',
          toolbar: { show: false },
          fontFamily: 'inherit',
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '72%',
            distributed: true,
            borderRadius: 6,
          },
        },
        colors: barColors,
        dataLabels: {
          enabled: false,
        },
        grid: {
          borderColor: chart.grid,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: false } },
        },
        xaxis: {
          categories: chartData.map((d) => d.x),
          labels: { style: { colors: chart.tick, fontSize: '12px' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: chart.tickSecondary, fontSize: '12px', fontWeight: 500 },
            maxWidth: 220,
          },
        },
        tooltip: {
          theme: chart.apexTheme,
          style: { fontSize: '13px' },
          custom: ({ series, seriesIndex, dataPointIndex, w }) =>
            buildFunnelTooltip({
              series,
              seriesIndex,
              dataPointIndex,
              categories: w.globals.labels as string[],
              bottleneck,
            }),
        },
        legend: { show: false },
      }}
      series={[{ name: 'Leads', data: chartData.map((d) => d.y) }]}
    />
  )
}

function buildFunnelTooltip({
  series,
  seriesIndex,
  dataPointIndex,
  categories,
  bottleneck,
}: {
  series: number[][]
  seriesIndex: number
  dataPointIndex: number
  categories: string[]
  bottleneck: FunnelBottleneck | null
}) {
  const value = series[seriesIndex]?.[dataPointIndex] ?? 0
  const stage = categories[dataPointIndex] ?? 'Etapa'
  const isBottleneck = bottleneck && bottleneck.stageName === stage && bottleneck.level !== 'ok'
  const total = series[seriesIndex]?.reduce((sum, item) => sum + item, 0) ?? 0
  const share = total > 0 ? Math.round((value / total) * 100) : 0

  return `<div class="rounded-xl border border-indigo/10 bg-cloud px-3 py-2.5 text-sm shadow-md dark:border-cloud/15 dark:bg-[#212529]/95">
      <p class="font-semibold text-indigo dark:text-cream">${escapeHtml(stage)}</p>
      <p class="mt-1 text-indigo/75 dark:text-cream/75">${value} leads · ${share}% do funil</p>
      ${
        isBottleneck
          ? '<p class="mt-1 text-xs font-semibold text-orange-700 dark:text-orange-300">Gargalo operacional</p>'
          : ''
      }
    </div>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
