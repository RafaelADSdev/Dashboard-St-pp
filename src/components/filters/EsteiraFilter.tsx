import { useFilterStore } from '@/store/filterStore'
import { filterLabelClass, filterSelectClass } from '@/components/ui/styles'

const options = [
  { value: 'TODAS', label: 'Todas as esteiras' },
  { value: 'GERAL', label: 'Comercial Geral' },
  { value: 'ECONOMICO', label: 'Comercial Econômico' },
] as const

export function EsteiraFilter() {
  const { esteira, setEsteira } = useFilterStore()

  return (
    <div className="flex flex-col gap-1.5">
      <label className={filterLabelClass}>Esteira</label>
      <select
        value={esteira}
        onChange={(e) => setEsteira(e.target.value as typeof esteira)}
        className={filterSelectClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
