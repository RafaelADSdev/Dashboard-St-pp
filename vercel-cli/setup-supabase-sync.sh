#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Uso: $0 <SUPABASE_SERVICE_ROLE_KEY> <CRON_SECRET> [SUPABASE_URL] [SYNC_START_DATE]"
  exit 1
fi

service_role_key="$1"
cron_secret="$2"
supabase_url="${3:-https://hejtayrfskmnekcykvjv.supabase.co}"
sync_start_date="${4:-2026-06-01}"
sync_overlap_minutes="${BITRIX_SYNC_OVERLAP_MINUTES:-60}"
publishable_key="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}"
anon_key="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

envs=(production preview development)

set_env() {
  local name="$1"
  local value="$2"
  for env in "${envs[@]}"; do
    npx vercel env rm "$name" "$env" --yes 2>/dev/null || true
    printf '%s' "$value" | npx vercel env add "$name" "$env"
  done
}

echo "Configurando Supabase + sincronizacao Bitrix na Vercel..."

set_env NEXT_PUBLIC_SUPABASE_URL "$supabase_url"
if [[ -n "$anon_key" ]]; then
  set_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$anon_key"
fi
if [[ -n "$publishable_key" ]]; then
  set_env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "$publishable_key"
fi
set_env SUPABASE_SERVICE_ROLE_KEY "$service_role_key"
set_env CRON_SECRET "$cron_secret"
set_env BITRIX_SYNC_START_DATE "$sync_start_date"
set_env BITRIX_SYNC_OVERLAP_MINUTES "$sync_overlap_minutes"

echo "Sincronizando .env.local..."
npx vercel env pull .env.local --yes

echo "Redeploy em producao..."
npx vercel --prod --yes

echo "Concluido."
echo 'Dispare a primeira sincronizacao com:'
echo 'curl -H "Authorization: Bearer SEU_CRON_SECRET" "https://dashboard-st-pp.vercel.app/api/cron/sync-bitrix"'
