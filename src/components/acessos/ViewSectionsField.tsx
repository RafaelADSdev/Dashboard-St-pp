'use client'

import clsx from 'clsx'
import type { UserViewSection } from '@/types/access'
import { ALL_VIEW_SECTIONS, VIEW_SECTION_OPTIONS } from '@/types/access'

const fieldLabelClass =
  'mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'

interface Props {
  value: UserViewSection[]
  onChange: (sections: UserViewSection[]) => void
  disabled?: boolean
  isAdmin?: boolean
}

export function ViewSectionsField({ value, onChange, disabled, isAdmin }: Props) {
  if (isAdmin) {
    return (
      <div>
        <p className={fieldLabelClass}>Áreas visíveis no dashboard</p>
        <p className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
          Administradores têm acesso a todas as áreas automaticamente.
        </p>
      </div>
    )
  }

  function toggleSection(section: UserViewSection, checked: boolean) {
    onChange(
      checked
        ? [...new Set([...value, section])]
        : value.filter((item) => item !== section)
    )
  }

  return (
    <div>
      <p className={fieldLabelClass}>Áreas visíveis no dashboard</p>
      <div className="grid gap-3 md:grid-cols-2">
        {VIEW_SECTION_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={clsx(
              'flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition',
              value.includes(option.value)
                ? 'border-violet-300 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10'
                : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={(e) => toggleSection(option.value, e.target.checked)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Desmarque as áreas que o usuário não deve visualizar. É necessário manter ao menos uma área
        ativa.
      </p>
      {value.length === 0 ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Selecione pelo menos uma área visível.
        </p>
      ) : null}
      {value.length > 0 && value.length < ALL_VIEW_SECTIONS.length ? (
        <p className="mt-2 text-xs text-slate-500">
          {value.length} de {ALL_VIEW_SECTIONS.length} áreas liberadas.
        </p>
      ) : null}
    </div>
  )
}
