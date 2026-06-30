import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  isActive: boolean
  children: ReactNode
  message?: string
}

export function FilterApplyingOverlay({
  isActive,
  children,
  message = 'Aplicando filtros...',
}: Props) {
  return (
    <div className="relative">
      {children}

      {isActive && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px] pointer-events-none"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-xl border border-blue-100 bg-white px-6 py-5 shadow-xl animate-[fadeIn_0.2s_ease-out] dark:border-blue-900 dark:bg-slate-800">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-blue-100 dark:border-blue-900" />
              <span className="absolute inset-0 rounded-full border-2 border-blue-800 border-t-transparent animate-spin dark:border-blue-400" />
              <Loader2 className="h-5 w-5 text-blue-900 animate-pulse dark:text-blue-300" />
            </div>
            <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">{message}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Buscando dados no Bitrix</p>
          </div>
        </div>
      )}
    </div>
  )
}
