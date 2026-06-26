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
          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl border border-blue-100 bg-white px-6 py-5 shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-blue-100" />
              <span className="absolute inset-0 rounded-full border-2 border-blue-800 border-t-transparent animate-spin" />
              <Loader2 className="h-5 w-5 text-blue-900 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-blue-950">{message}</p>
            <p className="text-xs text-slate-500">Buscando dados no Bitrix</p>
          </div>
        </div>
      )}
    </div>
  )
}
