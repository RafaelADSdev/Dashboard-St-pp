'use client'

import clsx from 'clsx'
import { CircleDot } from 'lucide-react'
import type { RoletaStat } from '@/api/types'
import { formatNumber } from '@/utils/formatters'

interface Props {
  roletas: RoletaStat[]
}

export function RoletasTable({ roletas }: Props) {
  if (roletas.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Nenhuma roleta ativa encontrada.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Roleta
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Comercial Geral
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Comercial Econômico
              </th>
            </tr>
          </thead>
          <tbody>
            {roletas.map((roleta, index) => (
              <tr
                key={roleta.id}
                className={clsx(
                  'border-b border-slate-100 last:border-0 dark:border-slate-700/80',
                  index % 2 === 1 && 'bg-slate-50/50 dark:bg-slate-900/30'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-100">{roleta.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatNumber(roleta.totalLeads)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatNumber(roleta.geralLeads)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-indigo-700 dark:text-indigo-300">
                  {formatNumber(roleta.economicoLeads)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
