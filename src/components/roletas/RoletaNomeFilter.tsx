'use client'

import {
  filterLabelClass,
  filterSelectClass,
  roletaFilterFieldClass,
  roletaFilterHintClass,
} from '@/components/ui/styles'

interface RoletaOption {
  id: string
  title: string
}

interface Props {
  value: string
  options: RoletaOption[]
  onChange: (value: string) => void
}

export function RoletaNomeFilter({ value, options, onChange }: Props) {
  const sorted = [...options].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))

  return (
    <div className={roletaFilterFieldClass}>
      <label className={filterLabelClass}>Roleta</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${filterSelectClass} w-full min-w-0`}
      >
        <option value="">Todas as roletas</option>
        {sorted.map((option) => (
          <option key={option.id} value={option.id}>
            {option.title}
          </option>
        ))}
      </select>
      <p className={roletaFilterHintClass}>Selecione uma roleta específica do catálogo</p>
    </div>
  )
}
