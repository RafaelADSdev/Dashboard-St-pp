'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return {
    isDark,
    grid: isDark ? '#334155' : '#f1f5f9',
    tick: isDark ? '#94a3b8' : '#64748b',
    tickSecondary: isDark ? '#cbd5e1' : '#475569',
    tooltip: {
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#f5f5f5',
      color: '#0f172a',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
      fontSize: '13px',
    },
    tooltipLabel: {
      color: '#0f172a',
      fontWeight: 600,
      marginBottom: 4,
    },
    tooltipItem: {
      color: '#334155',
    },
    cursor: isDark ? '#1e293b' : '#f8fafc',
    apexTheme: (isDark ? 'dark' : 'light') as 'dark' | 'light',
  }
}
