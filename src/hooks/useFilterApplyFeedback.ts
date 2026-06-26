import { useEffect, useRef } from 'react'
import { useFilterStore } from '@/store/filterStore'

const MIN_VISIBLE_MS = 600

/** Mantém o feedback visual ativo enquanto o usuário aplica filtros. */
export function useFilterApplyFeedback(isBusy: boolean) {
  const isApplying = useFilterStore((s) => s.isApplying)
  const setApplying = useFilterStore((s) => s.setApplying)
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (isApplying) {
      startedAtRef.current = Date.now()
      return
    }

    startedAtRef.current = null
  }, [isApplying])

  useEffect(() => {
    if (!isApplying || isBusy) return

    const startedAt = startedAtRef.current ?? Date.now()
    const elapsed = Date.now() - startedAt
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)

    const timer = window.setTimeout(() => {
      setApplying(false)
    }, remaining)

    return () => window.clearTimeout(timer)
  }, [isApplying, isBusy, setApplying])

  return isApplying
}
