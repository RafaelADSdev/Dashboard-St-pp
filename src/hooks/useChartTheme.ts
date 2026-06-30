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
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f1f5f9' : '#0f172a',
      boxShadow: isDark
        ? '0 4px 12px rgba(0, 0, 0, 0.35)'
        : '0 4px 12px rgba(15, 23, 42, 0.08)',
      fontSize: '13px',
    },
    cursor: isDark ? '#1e293b' : '#f8fafc',
    apexTheme: (isDark ? 'dark' : 'light') as 'dark' | 'light',
  }
}
