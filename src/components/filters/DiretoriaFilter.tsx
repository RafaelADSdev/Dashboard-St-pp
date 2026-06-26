import { useStuppStructurePreview } from '@/hooks/useStuppOrg'
import { useFilterStore } from '@/store/filterStore'
import { filterLabelClass, filterSelectClass } from '@/components/ui/styles'

export function DiretoriaFilter() {
  const { diretoria, setDiretoria } = useFilterStore()
  const { data, isLoading } = useStuppStructurePreview()

  return (
    <div className="flex flex-col gap-1.5">
      <label className={filterLabelClass}>Diretoria</label>
      <select
        value={diretoria}
        onChange={(e) => {
          setDiretoria(e.target.value)
        }}
        disabled={isLoading}
        className={`${filterSelectClass} min-w-[180px]`}
      >
        <option value="">Todas</option>
        {data?.diretorias.map((d) => (
          <option key={d.id} value={d.id}>
            {d.leaderName ? `${d.name} — ${d.leaderName}` : d.name}
          </option>
        ))}
      </select>
    </div>
  )
}
