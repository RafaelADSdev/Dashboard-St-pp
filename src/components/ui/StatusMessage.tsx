import { AlertCircle, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({ message = 'Carregando dados...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  )
}

export function ErrorState({
  title = 'Erro ao carregar dados',
  children,
}: {
  title?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] gap-3 px-6 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {children && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">{children}</p>}
    </div>
  )
}
