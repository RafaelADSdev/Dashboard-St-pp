'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { animate, motion, useReducedMotion } from 'motion/react'
import clsx from 'clsx'
import { useChartTheme } from '@/hooks/useChartTheme'

interface DataPoint {
  date: string
  economico: number
  geral: number
}

interface Props {
  data: DataPoint[]
  esteira?: 'both' | 'geral' | 'economico'
}

interface SeriesConfig {
  key: 'economico' | 'geral'
  label: string
  color: string
}

const CHART_WIDTH = 800
const CHART_HEIGHT = 280
const PADDING = { top: 28, right: 28, bottom: 44, left: 48 }

const SERIES: Record<'economico' | 'geral', SeriesConfig> = {
  economico: { key: 'economico', label: 'Econômico', color: '#6366f1' },
  geral: { key: 'geral', label: 'Geral', color: '#10b981' },
}

function getInnerSize() {
  return {
    width: CHART_WIDTH - PADDING.left - PADDING.right,
    height: CHART_HEIGHT - PADDING.top - PADDING.bottom,
  }
}

function getMaxValue(data: DataPoint[], keys: Array<'economico' | 'geral'>): number {
  let max = 1
  for (const point of data) {
    for (const key of keys) {
      max = Math.max(max, point[key])
    }
  }

  const magnitude = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / magnitude) * magnitude
}

function getPointX(index: number, count: number): number {
  const { width } = getInnerSize()
  if (count <= 1) return PADDING.left + width / 2
  return PADDING.left + (index / (count - 1)) * width
}

function getPointY(value: number, max: number): number {
  const { height } = getInnerSize()
  return PADDING.top + (1 - value / max) * height
}

function buildLinePath(values: number[], max: number): string {
  if (values.length === 0) return ''

  return values
    .map((value, index) => {
      const x = getPointX(index, values.length)
      const y = getPointY(value, max)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function buildAreaPath(values: number[], max: number): string {
  if (values.length === 0) return ''

  const line = buildLinePath(values, max)
  const firstX = getPointX(0, values.length)
  const lastX = getPointX(values.length - 1, values.length)
  const bottom = PADDING.top + getInnerSize().height

  return `${line} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`
}

function indexFromClientX(clientX: number, rect: DOMRect, count: number): number {
  if (count <= 1) return 0

  const ratio = (clientX - rect.left) / rect.width
  const x = ratio * CHART_WIDTH
  const { width } = getInnerSize()
  const innerRatio = Math.min(1, Math.max(0, (x - PADDING.left) / width))

  return Math.round(innerRatio * (count - 1))
}

function AnimatedNumber({ value }: { value: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const from = Number(node.dataset.value ?? value)
    const controls = animate(from, value, {
      duration: 0.35,
      ease: 'easeOut',
      onUpdate: (latest) => {
        node.textContent = String(Math.round(latest))
        node.dataset.value = String(latest)
      },
    })

    return () => controls.stop()
  }, [value])

  return <span ref={nodeRef}>{value}</span>
}

function ChartAnnotation({
  point,
  series,
  x,
  y,
  isDark,
}: {
  point: DataPoint
  series: SeriesConfig[]
  x: number
  y: number
  isDark: boolean
}) {
  const left = `${(x / CHART_WIDTH) * 100}%`
  const top = `${(y / CHART_HEIGHT) * 100}%`

  return (
    <motion.div
      className={clsx(
        'pointer-events-none absolute z-10 min-w-[148px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border px-3 py-2 shadow-lg',
        isDark
          ? 'border-white/10 bg-indigo/95 text-cream'
          : 'border-slate-200/80 bg-white/95 text-slate-900'
      )}
      style={{ left, top }}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <p className={clsx('text-[11px] font-semibold', isDark ? 'text-cream/70' : 'text-slate-500')}>
        {point.date}
      </p>
      <div className="mt-1 space-y-1">
        {series.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="font-semibold tabular-nums">
              <AnimatedNumber value={point[item.key]} />
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function LeadsOverTimeChart({ data, esteira = 'both' }: Props) {
  const chart = useChartTheme()
  const reduceMotion = useReducedMotion()
  const baseId = useId().replace(/:/g, '')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const visibleSeries = useMemo(() => {
    const items: SeriesConfig[] = []
    if (esteira === 'both' || esteira === 'economico') items.push(SERIES.economico)
    if (esteira === 'both' || esteira === 'geral') items.push(SERIES.geral)
    return items
  }, [esteira])

  const keys = useMemo(
    () => visibleSeries.map((item) => item.key),
    [visibleSeries]
  )

  const maxValue = useMemo(() => getMaxValue(data, keys), [data, keys])
  const dataKey = useMemo(
    () => data.map((point) => `${point.date}:${point.economico}:${point.geral}`).join('|'),
    [data]
  )

  const yTicks = useMemo(() => {
    const steps = 4
    return Array.from({ length: steps + 1 }, (_, index) => Math.round((maxValue / steps) * index))
  }, [maxValue])

  const xLabelIndexes = useMemo(() => {
    if (data.length <= 1) return data.length ? [0] : []
    if (data.length <= 7) return data.map((_, index) => index)

    const indexes = new Set<number>([0, data.length - 1])
    const step = Math.ceil((data.length - 1) / 5)
    for (let index = step; index < data.length - 1; index += step) {
      indexes.add(index)
    }
    return [...indexes].sort((a, b) => a - b)
  }, [data])

  const activePoint = activeIndex !== null ? data[activeIndex] : null
  const primarySeries = visibleSeries[0]
  const primaryValue = activePoint && primarySeries ? activePoint[primarySeries.key] : 0
  const cursorX = activeIndex !== null ? getPointX(activeIndex, data.length) : 0
  const cursorY = getPointY(primaryValue, maxValue)

  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Sem dados no período selecionado.
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-[280px] w-full touch-none select-none"
        role="img"
        aria-label="Evolução de leads no período"
        onPointerLeave={() => setActiveIndex(null)}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setActiveIndex(indexFromClientX(event.clientX, rect, data.length))
        }}
      >
        <defs>
          {visibleSeries.map((item) => (
            <linearGradient
              key={item.key}
              id={`${baseId}-${item.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={item.color} stopOpacity={0.32} />
              <stop offset="95%" stopColor={item.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {yTicks.map((tick) => {
          const y = getPointY(tick, maxValue)
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke={chart.grid}
                strokeDasharray="4 4"
              />
              <text
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill={chart.tick}
              >
                {tick}
              </text>
            </g>
          )
        })}

        {xLabelIndexes.map((index) => (
          <text
            key={data[index].date}
            x={getPointX(index, data.length)}
            y={CHART_HEIGHT - 14}
            textAnchor="middle"
            fontSize="11"
            fill={chart.tick}
          >
            {data[index].date}
          </text>
        ))}

        {visibleSeries.map((item) => {
          const values = data.map((point) => point[item.key])
          const linePath = buildLinePath(values, maxValue)
          const areaPath = buildAreaPath(values, maxValue)

          return (
            <g key={`${item.key}-${dataKey}`}>
              <motion.path
                d={areaPath}
                fill={`url(#${baseId}-${item.key})`}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.15 }}
              />
              <motion.path
                d={linePath}
                fill="none"
                stroke={item.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
              />
            </g>
          )
        })}

        {activePoint && activeIndex !== null && (
          <>
            <motion.line
              x1={cursorX}
              x2={cursorX}
              y1={PADDING.top}
              y2={PADDING.top + getInnerSize().height}
              stroke={chart.isDark ? 'rgba(241,245,249,0.35)' : 'rgba(15,23,42,0.18)'}
              strokeWidth={1.5}
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            />

            {visibleSeries.map((item) => {
              const value = activePoint[item.key]
              const y = getPointY(value, maxValue)

              return (
                <motion.g key={item.key}>
                  <motion.circle
                    cx={cursorX}
                    cy={y}
                    r={10}
                    fill={item.color}
                    opacity={0.18}
                    initial={false}
                    animate={{ cx: cursorX, cy: y }}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                  <motion.circle
                    cx={cursorX}
                    cy={y}
                    r={4.5}
                    fill={chart.isDark ? '#0f172a' : '#ffffff'}
                    stroke={item.color}
                    strokeWidth={2.5}
                    initial={false}
                    animate={{ cx: cursorX, cy: y }}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                </motion.g>
              )
            })}
          </>
        )}
      </svg>

      {activePoint && activeIndex !== null && (
        <ChartAnnotation
          point={activePoint}
          series={visibleSeries}
          x={cursorX}
          y={cursorY}
          isDark={chart.isDark}
        />
      )}

      {esteira === 'both' && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          {visibleSeries.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
