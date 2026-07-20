import { useMemo } from 'react'
import { useStuppStructurePreview } from '@/hooks/useStuppOrg'
import { getDiretoriaUserIds } from '@/lib/diretoriaScope'
import { useFilterStore } from '@/store/filterStore'
import { filterLabelClass, filterSelectClass } from '@/components/ui/styles'

interface Props {
  label?: string
}

export function CorretorFilter({ label = 'Corretor' }: Props) {
  const { corretor, setCorretor, diretoria, equipe } = useFilterStore()
  const { data, isLoading } = useStuppStructurePreview()

  const corretores = useMemo(() => {
    const all = data?.corretores ?? []
    const org = data?.org
    if (!org) return all

    if (equipe) {
      const team = org.diretorias.flatMap((d) => d.teams).find((t) => t.id === equipe)
      if (!team) return []
      const ids = new Set(team.userIds)
      return all.filter((item) => ids.has(item.id))
    }

    if (diretoria) {
      const diretoriaItem = org.diretorias.find((d) => d.id === diretoria)
      if (!diretoriaItem) return []
      const ids = new Set(getDiretoriaUserIds(diretoriaItem))
      return all.filter((item) => ids.has(item.id))
    }

    return all
  }, [data, diretoria, equipe])

  return (
    <div className="flex flex-col gap-1.5">
      <label className={filterLabelClass}>{label}</label>
      <select
        value={corretor}
        onChange={(e) => setCorretor(e.target.value)}
        disabled={isLoading}
        className={`${filterSelectClass} min-w-[220px] max-w-[280px]`}
      >
        <option value="">Todos</option>
        {corretores.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {item.equipe}
          </option>
        ))}
      </select>
    </div>
  )
}
