import { useStuppStructurePreview } from '@/hooks/useStuppOrg'
import { useFilterStore } from '@/store/filterStore'
import { filterLabelClass, filterSelectClass } from '@/components/ui/styles'

export function EquipeFilter() {
  const { equipe, setEquipe, diretoria } = useFilterStore()
  const { data, isLoading } = useStuppStructurePreview()

  const diretorias = diretoria
    ? (data?.diretorias.filter((d) => d.id === diretoria) ?? [])
    : (data?.diretorias ?? [])

  return (
    <div className="flex flex-col gap-1.5">
      <label className={filterLabelClass}>Equipe</label>
      <select
        value={equipe}
        onChange={(e) => setEquipe(e.target.value)}
        disabled={isLoading}
        className={`${filterSelectClass} min-w-[220px] max-w-[280px]`}
      >
        <option value="">Todas</option>
        {diretorias.map((diretoriaItem) => (
          <optgroup
            key={diretoriaItem.id}
            label={
              diretoriaItem.leaderName
                ? `${diretoriaItem.name} (${diretoriaItem.leaderName})`
                : diretoriaItem.name
            }
          >
            {diretoriaItem.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
