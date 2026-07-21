# Acessos

> ⚠️ Este arquivo registra apenas referências. Senhas e tokens vivem em `.env.local`, no Bitrix24, no Supabase ou na Vercel — NUNCA em texto plano aqui.

| Serviço | URL | Usuário | Onde está a credencial |
|---|---|---|---|
| Repositório GitHub | https://github.com/RafaelADSdev/Dashboard-St-pp | — | conta GitHub |
| Produção (Vercel) | https://dashboard-st-pp.vercel.app | — | painel Vercel |
| Supabase (projeto) | https://supabase.com/dashboard (projeto em `NEXT_PUBLIC_SUPABASE_URL`) | — | painel Supabase |
| Bitrix24 (webhook) | portal `*.bitrix24.com.br` | — | `$BITRIX_WEBHOOK_URL` (`.env.local` / Vercel env) |
| Supabase service role | — | — | `$SUPABASE_SERVICE_ROLE_KEY` (só servidor / seed) |

### Variáveis de ambiente (referências, não valores)
- `BITRIX_WEBHOOK_URL` — servidor (proxy Bitrix)
- `BITRIX_WEBHOOK_URL_META` / `BITRIX_WEBHOOK_URL_DEALS` — webhooks auxiliares opcionais
- `NEXT_PUBLIC_BITRIX_ESTEIRA_GERAL_ID` / `..._ECONOMICO_ID`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou anon legada)
- `SUPABASE_SERVICE_ROLE_KEY` — sincronização e APIs server-side, nunca no client
- `CRON_SECRET` — autorização de `/api/cron/sync-bitrix`
- `BITRIX_SYNC_START_DATE=2026-06-01` / `BITRIX_SYNC_OVERLAP_MINUTES=60`
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — cache distribuído opcional

> Após o seed inicial (`npm run seed:admin`), troque a senha do admin no painel Supabase. Nunca registre credenciais nem URLs de projeto com identificador fixo neste arquivo.
