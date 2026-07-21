'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, LogOut, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useFilterStore } from '@/store/filterStore'
import { useLayoutUiStore } from '@/store/layoutUiStore'

type RefreshStatus = 'idle' | 'syncing' | 'success' | 'error'
type RefreshSource = 'manual' | 'automatic'

const AUTO_SYNC_INTERVAL_MS = 5 * 60_000
const AUTO_SYNC_CHECK_INTERVAL_MS = 30_000
const AUTO_SYNC_STORAGE_KEY = 'stupp:last-auto-bitrix-sync-at'
let fallbackAutoSyncAttemptAt = 0

interface SyncResponse {
  skipped?: boolean
  dealsSynced?: number
  message?: string
  error?: string
}

function markAutoSyncAttempt(now = Date.now()) {
  fallbackAutoSyncAttemptAt = now

  try {
    window.localStorage.setItem(AUTO_SYNC_STORAGE_KEY, String(now))
  } catch {
    // A sincronização continua funcionando quando o armazenamento está indisponível.
  }
}

function ensureAutoSyncBaseline(now = Date.now()) {
  try {
    const storedAttempt = Number(window.localStorage.getItem(AUTO_SYNC_STORAGE_KEY) ?? 0)

    if (Number.isFinite(storedAttempt) && storedAttempt > 0 && storedAttempt <= now) {
      fallbackAutoSyncAttemptAt = storedAttempt
      return
    }

    markAutoSyncAttempt(now)
  } catch {
    if (fallbackAutoSyncAttemptAt === 0) {
      fallbackAutoSyncAttemptAt = now
    }
  }
}

function claimAutoSyncWindow(now = Date.now()) {
  let lastAttempt = fallbackAutoSyncAttemptAt

  try {
    const storedAttempt = Number(window.localStorage.getItem(AUTO_SYNC_STORAGE_KEY) ?? 0)
    if (Number.isFinite(storedAttempt) && storedAttempt > 0 && storedAttempt <= now) {
      lastAttempt = storedAttempt
    }
  } catch {
    // Usa o marcador em memória quando o armazenamento está indisponível.
  }

  if (lastAttempt > 0 && now - lastAttempt < AUTO_SYNC_INTERVAL_MS) return false

  markAutoSyncAttempt(now)
  return true
}

function useFilterIndicators(ignoreEsteira = false) {
  const applied = useFilterStore((s) => s.applied)
  const hasPending = useFilterStore((s) => s.hasPendingChanges(ignoreEsteira))

  const hasActiveFilters = Boolean(
    applied &&
      (applied.diretoria ||
        applied.equipe ||
        applied.roleta ||
        (!ignoreEsteira && applied.esteira !== 'TODAS'))
  )

  return { hasPending, hasActiveFilters }
}

export function Header() {
  const pathname = usePathname() ?? '/'
  const queryClient = useQueryClient()
  const { data: profile } = useCurrentProfile()
  const toggleFilters = useLayoutUiStore((s) => s.toggleFilters)
  const filtersOpen = useLayoutUiStore((s) => s.filtersOpen)
  const { hasPending, hasActiveFilters } = useFilterIndicators(pathname !== '/')
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle')
  const [refreshMessage, setRefreshMessage] = useState('')
  const resetTimerRef = useRef<number | null>(null)
  const refreshInFlightRef = useRef(false)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const scheduleFeedbackReset = useCallback(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current)
    }
    resetTimerRef.current = window.setTimeout(() => {
      setRefreshStatus('idle')
      setRefreshMessage('')
    }, 4_000)
  }, [])

  const refreshDashboardQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['leads'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['roletas-stats'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['stupp-org'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['stupp-roletas'], refetchType: 'active' }),
    ])
  }, [queryClient])

  const handleRefresh = useCallback(async (source: RefreshSource = 'manual') => {
    if (refreshInFlightRef.current) return

    refreshInFlightRef.current = true

    if (profile?.isAdmin) {
      markAutoSyncAttempt()
    }

    setRefreshStatus('syncing')
    setRefreshMessage(
      profile?.isAdmin
        ? source === 'automatic'
          ? 'Atualização automática: sincronizando Bitrix com o Supabase.'
          : 'Sincronizando Bitrix com o Supabase.'
        : 'Recarregando dados do Supabase.'
    )

    try {
      let successMessage = 'Dados recarregados do Supabase.'

      if (profile?.isAdmin) {
        const response = await fetch('/api/admin/sync-bitrix', {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
        })
        const body = (await response.json().catch(() => ({}))) as SyncResponse

        if (!response.ok) {
          throw new Error(body.error ?? 'Não foi possível sincronizar o Supabase.')
        }

        successMessage = body.skipped
          ? 'Já existe uma sincronização em andamento.'
          : (body.message ?? `${body.dealsSynced ?? 0} negócio(s) sincronizado(s).`)
      }

      await refreshDashboardQueries()
      setRefreshStatus('success')
      setRefreshMessage(successMessage)
    } catch (error) {
      setRefreshStatus('error')
      setRefreshMessage(
        error instanceof Error ? error.message : 'Erro ao atualizar os dados.'
      )
    } finally {
      refreshInFlightRef.current = false
      scheduleFeedbackReset()
    }
  }, [profile?.isAdmin, refreshDashboardQueries, scheduleFeedbackReset])

  useEffect(() => {
    if (!profile?.isAdmin) return

    ensureAutoSyncBaseline()

    const runAutomaticRefresh = () => {
      if (document.visibilityState !== 'visible' || !claimAutoSyncWindow()) return
      void handleRefresh('automatic')
    }

    const intervalId = window.setInterval(
      runAutomaticRefresh,
      AUTO_SYNC_CHECK_INTERVAL_MS
    )
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runAutomaticRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleRefresh, profile?.isAdmin])

  const handleLogout = () => {
    window.location.assign('/auth/logout')
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-indigo/10 bg-[#f8f9fa]/95 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-indigo/80 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <button
          type="button"
          onClick={toggleFilters}
          aria-expanded={filtersOpen}
          className={clsx(
            'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            filtersOpen || hasActiveFilters
              ? 'bg-black/6 text-indigo dark:bg-sidebar-active dark:text-cream'
              : 'text-indigo/80 hover:bg-black/5 hover:text-indigo dark:text-cream/80 dark:hover:bg-sidebar-hover dark:hover:text-cream'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {(hasPending || hasActiveFilters) && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-2 ring-[#f8f9fa] dark:ring-indigo" />
          )}
        </button>
        <button
          type="button"
          onClick={() => void handleRefresh('manual')}
          disabled={refreshStatus === 'syncing'}
          aria-busy={refreshStatus === 'syncing'}
          title={
            refreshMessage ||
            (profile?.isAdmin
              ? 'Sincronizar Bitrix com o Supabase e recarregar o dashboard'
              : 'Recarregar os dados atuais do Supabase')
          }
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-80',
            refreshStatus === 'success'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : refreshStatus === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand-600 text-cream hover:bg-brand-700'
          )}
        >
          {refreshStatus === 'success' ? (
            <Check className="h-3.5 w-3.5" />
          ) : refreshStatus === 'error' ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <RefreshCw
              className={clsx('h-3.5 w-3.5', refreshStatus === 'syncing' && 'animate-spin')}
            />
          )}
          <span className="hidden sm:inline">
            {refreshStatus === 'syncing'
              ? 'Sincronizando'
              : refreshStatus === 'success'
                ? 'Atualizado'
                : refreshStatus === 'error'
                  ? 'Tentar novamente'
                  : 'Atualizar'}
          </span>
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {refreshMessage}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo/70 transition-colors hover:bg-black/5 hover:text-indigo dark:text-cream/70 dark:hover:bg-sidebar-hover dark:hover:text-cream"
          title="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
