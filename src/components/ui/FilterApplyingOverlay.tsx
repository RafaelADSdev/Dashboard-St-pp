'use client'

import clsx from 'clsx'
import type { ReactNode } from 'react'
import { JumpingDotsLoader } from '@/components/ui/JumpingDotsLoader'

interface Props {
  isActive: boolean
  children: ReactNode
  message?: string
}

function stripTrailingDots(message: string) {
  return message.replace(/\.+$/, '')
}

export function FilterApplyingOverlay({
  isActive,
  children,
  message = 'Aplicando filtros',
}: Props) {
  const label = stripTrailingDots(message)

  return (
    <div className="relative">
      <div
        className={clsx(
          'transition-[opacity,filter] duration-300 ease-out',
          isActive && 'pointer-events-none opacity-50 blur-[1.5px]'
        )}
      >
        {children}
      </div>

      {isActive && (
        <div
          className="filter-overlay-backdrop fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="filter-overlay-card flex flex-col items-center gap-4 rounded-2xl border border-blue-200/90 bg-white px-8 py-6 dark:border-blue-500/35 dark:bg-slate-800">
            <JumpingDotsLoader />

            <div className="text-center">
              <p className="text-sm font-semibold text-blue-950 dark:text-blue-50">{label}</p>
              <p className="filter-overlay-subtitle mt-1 text-xs text-slate-500 dark:text-slate-400">
                Buscando dados no Bitrix
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
