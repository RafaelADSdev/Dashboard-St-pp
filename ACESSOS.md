# Acessos

> ⚠️ Adicionar `.project/ACESSOS.md` ao `.gitignore`. Senhas/tokens vivem em `.env.local` / Bitrix24 / painel Supabase — NUNCA em texto plano aqui.

| Serviço | URL | Usuário | Onde está a credencial |
|---|---|---|---|
| Repositório GitHub | https://github.com/RafaelADSdev/Dashboard-St-pp | — | conta GitHub |
| Produção (Vercel) | https://dashboard-st-pp.vercel.app | — | painel Vercel |
| Supabase (projeto) | https://supabase.com/dashboard/project/hejtayrfskmnekcykvjv | — | painel Supabase |
| Bitrix24 (webhook) | portal `*.bitrix24.com.br` | — | `$BITRIX_WEBHOOK_URL` (`.env.local` / Vercel env) |
| Supabase service role | — | — | `$SUPABASE_SERVICE_ROLE_KEY` (só servidor / seed) |

### Variáveis de ambiente (referências, não valores)
- `BITRIX_WEBHOOK_URL` — servidor (proxy Bitrix)
- `NEXT_PUBLIC_BITRIX_ESTEIRA_GERAL_ID` / `..._ECONOMICO_ID`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — só `npm run seed:admin`, nunca no client

> Admin inicial padrão (`admin`/`admin123`) — **trocar senha em produção** se ainda for o default.
