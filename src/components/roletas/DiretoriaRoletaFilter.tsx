'use client'

import {
  filterLabelClass,
  filterSelectClass,
  roletaFilterFieldClass,
  roletaFilterHintClass,
} from '@/components/ui/styles'

interface DiretoriaOption {
  id: string
  name: string
  leaderName?: string
}

interface Props {
  value: string
  options: DiretoriaOption[]
  onChange: (value: string) => void
}

export function DiretoriaRoletaFilter({ value, options, onChange }: Props) {
  return (
    <div className={roletaFilterFieldClass}>
      <label className={filterLabelClass}>Diretoria</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${filterSelectClass} w-full min-w-0`}
      >
        <option value="">Todas as diretorias</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.leaderName ? `${option.name} — ${option.leaderName}` : option.name}
          </option>
        ))}
      </select>
      <p className={roletaFilterHintClass}>Filtra roletas por diretoria dos corretores</p>
    </div>
  )
}
