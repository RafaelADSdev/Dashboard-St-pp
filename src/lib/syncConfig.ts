/** Intervalo de atualização dos dados do dashboard (cliente + cache servidor). */
export const DASHBOARD_SYNC_MS = 5 * 60_000

export const DASHBOARD_SYNC_SECONDS = DASHBOARD_SYNC_MS / 1000

/** Cache curto das respostas agregadas; a fonte continua sendo o Supabase. */
export const DASHBOARD_QUERY_CACHE_SECONDS = 60
