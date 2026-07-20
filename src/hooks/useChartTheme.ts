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
    grid: isDark ? '#5c636a' : '#e9ecef',
    tick: isDark ? '#adb5bd' : '#6c757d',
    tickSecondary: isDark ? '#d8dce8' : '#343b56',
    tooltip: {
      borderRadius: '12px',
      border: isDark ? '1px solid rgba(245,245,245,0.12)' : '1px solid rgba(33,40,66,0.1)',
      backgroundColor: isDark ? '#212529' : '#f8f9fa',
      color: isDark ? '#f8f9fa' : '#343a40',
      boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 4px 12px rgba(33,40,66,0.1)',
      fontSize: '13px',
    },
    tooltipLabel: {
      color: isDark ? '#f8f9fa' : '#343a40',
      fontWeight: 600,
      marginBottom: 4,
    },
    tooltipItem: {
      color: isDark ? '#e9ecef' : '#6c757d',
    },
    cursor: isDark ? 'rgba(50,59,94,0.35)' : 'rgba(33,40,66,0.06)',
    apexTheme: (isDark ? 'dark' : 'light') as 'dark' | 'light',
  }
}
