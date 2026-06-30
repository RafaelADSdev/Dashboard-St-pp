'use client'

import dynamic from 'next/dynamic'
import { STAGE_CHART_COLORS } from '@/lib/stageColors'
import { useChartTheme } from '@/hooks/useChartTheme'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface Props {
  data: { x: string; y: number }[]
}

const FUNNEL_COLORS = STAGE_CHART_COLORS

export function PipelineFunnelChart({ data }: Props) {
  const chart = useChartTheme()
  const chartData = data.filter((item) => item.y > 0)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-slate-400 dark:text-slate-500">
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
        colors: FUNNEL_COLORS,
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
          theme: 'light',
          style: { fontSize: '13px' },
          y: { formatter: (val: number) => `${val} leads` },
        },
        legend: { show: false },
      }}
      series={[{ name: 'Leads', data: chartData.map((d) => d.y) }]}
    />
  )
}
