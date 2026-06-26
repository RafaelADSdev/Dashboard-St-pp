'use client'

import dynamic from 'next/dynamic'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface Props {
  data: { x: string; y: number }[]
}

const FUNNEL_COLORS = ['#f59e0b', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#22c55e', '#ef4444']

export function PipelineFunnelChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
        Nenhum dado no período selecionado
      </div>
    )
  }

  return (
    <ReactApexChart
      type="bar"
      height={320}
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
            dataLabels: { position: 'bottom' },
          },
        },
        colors: FUNNEL_COLORS,
        dataLabels: {
          enabled: true,
          textAnchor: 'start',
          offsetX: 6,
          formatter: (val: number) => `${val}`,
          style: { fontSize: '12px', fontWeight: 600, colors: ['#fff'] },
        },
        grid: {
          borderColor: '#f1f5f9',
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: false } },
        },
        xaxis: {
          categories: data.map((d) => d.x),
          labels: { style: { colors: '#64748b', fontSize: '12px' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: { style: { colors: '#475569', fontSize: '12px', fontWeight: 500 } },
        },
        tooltip: {
          theme: 'light',
          style: { fontSize: '13px' },
          y: { formatter: (val: number) => `${val} leads` },
        },
        legend: { show: false },
      }}
      series={[{ name: 'Leads', data: data.map((d) => d.y) }]}
    />
  )
}
