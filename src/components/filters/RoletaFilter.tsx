import { useEffect, useMemo } from 'react'
import { useStuppRoletasCatalog } from '@/hooks/useStuppRoletas'
import { useStuppStructurePreview } from '@/hooks/useStuppOrg'
import { useFilterStore } from '@/store/filterStore'
import { filterLabelClass, filterSelectClass } from '@/components/ui/styles'
import { isRoletaAtivaForFilter } from '@/lib/roletaStatus'
import {
  isRoletaFilterActiveOnly,
  ROLETA_FILTER_ACTIVE_ONLY,
  ROLETA_FILTER_ACTIVE_ONLY_LABEL,
} from '@/api/bitrixRoletas'
import { roletaBelongsToDiretoria } from '@/lib/diretoriaScope'

export function RoletaFilter() {
  const { roleta, setRoleta, diretoria } = useFilterStore()
  const { data: catalogData, isLoading } = useStuppRoletasCatalog()
  const { data: orgPreview } = useStuppStructurePreview()

  const activeRoletas = useMemo(() => {
    const roletas = catalogData?.roletas?.filter(isRoletaAtivaForFilter) ?? []
    if (!diretoria || !orgPreview?.org) return roletas

    const selectedDiretoria = orgPreview.org.diretorias.find((item) => item.id === diretoria)
    if (!selectedDiretoria) return roletas

    return roletas.filter((roletaItem) =>
      roletaBelongsToDiretoria(
        roletaItem,
        catalogData?.membershipByRoletaId?.[roletaItem.id],
        orgPreview.org,
        selectedDiretoria
      )
    )
  }, [catalogData, diretoria, orgPreview])

  useEffect(() => {
    if (!roleta || isRoletaFilterActiveOnly(roleta) || activeRoletas.length === 0) return
    if (!activeRoletas.some((item) => item.id === roleta)) {
      setRoleta('')
    }
  }, [roleta, activeRoletas, setRoleta])

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
        <option value={ROLETA_FILTER_ACTIVE_ONLY}>{ROLETA_FILTER_ACTIVE_ONLY_LABEL}</option>
        {activeRoletas.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
    </div>
  )
}
