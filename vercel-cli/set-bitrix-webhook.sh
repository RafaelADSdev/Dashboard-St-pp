#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <BITRIX_WEBHOOK_URL>"
  exit 1
fi

webhook="${1%/}/"
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

vars=(BITRIX_WEBHOOK_URL BITRIX_WEBHOOK_URL_META BITRIX_WEBHOOK_URL_DEALS)
envs=(production preview development)

echo "Atualizando webhooks Bitrix na Vercel..."

for var in "${vars[@]}"; do
  for env in "${envs[@]}"; do
    npx vercel env rm "$var" "$env" --yes 2>/dev/null || true
    printf '%s' "$webhook" | npx vercel env add "$var" "$env"
  done
done

echo "Sincronizando .env.local..."
npx vercel env pull .env.local --yes

echo "Redeploy em producao..."
npx vercel --prod --yes

echo "Concluido."
