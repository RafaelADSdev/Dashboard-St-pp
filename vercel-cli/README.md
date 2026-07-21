# Vercel CLI — variáveis Bitrix e Supabase

Scripts para atualizar webhooks do Bitrix24 e a camada Supabase na Vercel sem expor tokens no repositório.

Projeto de destino: `auzendegbrs-projects/dashboard-st-pp`. Execute os comandos a
partir da raiz do repositório `RafaelADSdev/Dashboard-St-pp` e confira o destino
com `npx vercel env ls` antes de substituir variáveis.

## Pré-requisitos

```bash
npx vercel login
npx vercel link --project dashboard-st-pp --yes   # na raiz (cria .vercel/, gitignored)
```

## Atualizar webhook Bitrix

**Windows (PowerShell):**

```powershell
.\vercel-cli\set-bitrix-webhook.ps1 "https://hubnogueira.bitrix24.com.br/rest/USER_ID/TOKEN/"
```

**Linux / macOS:**

```bash
chmod +x vercel-cli/set-bitrix-webhook.sh
./vercel-cli/set-bitrix-webhook.sh "https://hubnogueira.bitrix24.com.br/rest/USER_ID/TOKEN/"
```

O script atualiza `BITRIX_WEBHOOK_URL`, `BITRIX_WEBHOOK_URL_META` e `BITRIX_WEBHOOK_URL_DEALS` em **production**, **preview** e **development**, sincroniza `.env.local` e dispara redeploy em produção.

## Configurar Supabase + sincronização Bitrix → Supabase

O dashboard lê dados operacionais do Supabase. O cron `GET /api/cron/sync-bitrix` usa o webhook Bitrix no servidor para espelhar negócios desde `2026-06-01`, excluindo responsáveis fora das diretorias Stüpp nomeadas.

> **Plano Hobby Vercel:** só permite cron **1x/dia** (`0 5 * * *` em `vercel.json`). Para sincronizar a cada 5 minutos, use um cron externo (ex.: cron-job.org) chamando a rota com `Authorization: Bearer CRON_SECRET`. No plano Pro, altere o schedule para `*/5 * * * *`.

Variáveis necessárias:

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Auth no client |
| `SUPABASE_SERVICE_ROLE_KEY` | Sync e APIs server-side |
| `CRON_SECRET` | Protege `/api/cron/sync-bitrix` |
| `BITRIX_SYNC_START_DATE` | Início do backfill (`YYYY-MM-DD`) |
| `BITRIX_SYNC_OVERLAP_MINUTES` | Sobreposição do incremental (padrão `60`) |

**Windows:**

```powershell
.\vercel-cli\setup-supabase-sync.ps1 `
  -ServiceRoleKey "sua_service_role" `
  -CronSecret "seu_cron_secret" `
  -SupabaseAnonKey "sua_chave_anon" `
  -SyncStartDate "2026-06-01"
```

**Linux / macOS:**

```bash
chmod +x vercel-cli/setup-supabase-sync.sh
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_chave_anon" \
  ./vercel-cli/setup-supabase-sync.sh "sua_service_role" "seu_cron_secret"
```

Após o deploy, dispare a sincronização manualmente:

```bash
curl -H "Authorization: Bearer SEU_CRON_SECRET" \
  "https://dashboard-st-pp.vercel.app/api/cron/sync-bitrix"
```

Para reconciliar um intervalo específico sem reiniciar todo o backfill:

```bash
curl -H "Authorization: Bearer SEU_CRON_SECRET" \
  "https://dashboard-st-pp.vercel.app/api/cron/sync-bitrix?from=2026-06-07&to=2026-06-13"
```

O dashboard só aceita datas iguais ou posteriores à `coverage_start` registrada
em `bitrix_sync_state`. Se o cron falhar, confira `last_error` antes de repetir.

## Comandos úteis

```bash
npx vercel env ls
npx vercel env pull .env.local
npx vercel --prod --yes
npm run check:supabase   # valida chaves no .env.local
```

## Segurança

- Nunca commite URLs de webhook, service role ou `.env.local`
- Tokens vivem apenas na Vercel e no `.env.local` local (gitignored)
- `NEXT_PUBLIC_*` pode ir para o navegador; nunca use esse prefixo em `service_role` ou `CRON_SECRET`
- Passe `NEXT_PUBLIC_SUPABASE_URL` via parâmetro ou `.env.local` nos scripts — não fixe o project ref no repositório
- `npm run seed:admin` é só para bootstrap local; troque a senha do admin no Supabase após criar e não execute o seed em produção sem revisar o script
