import { useEffect } from 'react'
import { useFilterStore } from '@/store/filterStore'

export function useFilterApplyFeedback(isFetching: boolean) {
  const isApplying = useFilterStore((s) => s.isApplying)
  const setApplying = useFilterStore((s) => s.setApplying)

  useEffect(() => {
    if (isApplying && !isFetching) {
      setApplying(false)
    }
  }, [isApplying, isFetching, setApplying])

  return isApplying && isFetching
}
