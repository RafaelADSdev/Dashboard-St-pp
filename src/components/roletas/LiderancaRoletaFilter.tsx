'use client'

import {
  filterLabelClass,
  filterSelectClass,
  roletaFilterFieldClass,
  roletaFilterHintClass,
} from '@/components/ui/styles'

interface LiderancaOption {
  id: string
  name: string
  diretoriaId?: string
}

interface Props {
  value: string
  options: LiderancaOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function LiderancaRoletaFilter({ value, options, onChange, disabled }: Props) {
  return (
    <div className={roletaFilterFieldClass}>
      <label className={filterLabelClass}>Liderança</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`${filterSelectClass} w-full min-w-0`}
      >
        <option value="">Todas as lideranças</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <p className={roletaFilterHintClass}>Líder e equipe com corretores na roleta</p>
    </div>
  )
}
