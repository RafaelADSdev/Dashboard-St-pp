import { isInactiveRoletaTitle } from '@/api/bitrixRoletas'
import { useStuppRoletas } from '@/hooks/useStuppRoletas'
import { useFilterStore } from '@/store/filterStore'
import { filterLabelClass, filterSelectClass } from '@/components/ui/styles'

export function RoletaFilter() {
  const { roleta, setRoleta } = useFilterStore()
  const { data: roletas, isLoading } = useStuppRoletas()

  const activeRoletas = roletas?.filter((item) => !isInactiveRoletaTitle(item.title)) ?? []

  return (
    <div className="flex flex-col gap-1.5">
      <label className={filterLabelClass}>Roleta</label>
      <select
        value={roleta}
        onChange={(e) => setRoleta(e.target.value)}
        disabled={isLoading}
        className={`${filterSelectClass} min-w-[240px] max-w-[320px]`}
      >
        <option value="">Todas</option>
        {activeRoletas.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
    </div>
  )
}
