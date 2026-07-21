# Contexto — Dashboard Superintendência Stüpp

## O que é
Painel operacional Next.js para acompanhar negociações da Superintendência Stüpp. O Bitrix24 é a origem e recebe as movimentações; o Supabase mantém o espelho operacional consultado pelo dashboard, pelos filtros e pelos relatórios. Deploy em produção na Vercel.

## Estado atual
- **Em produção:** https://dashboard-st-pp.vercel.app
- Repositório principal: https://github.com/RafaelADSdev/Dashboard-St-pp (`main`).
- Auth via Supabase (login por nome de usuário → `usuario@stupp.dashboard`).
- Duas esteiras comerciais: Geral (cat. 16) e Econômico (cat. 64).
- Dashboard lê somente `bitrix_deals` e snapshots do Supabase, sempre por API server-side.
- Filtros de período, esteira, diretoria, equipe, corretor e roleta são aplicados no Supabase.
- O webhook Bitrix é usado pela sincronização e pelas mutações do kanban.
- Backfill configurado desde `2026-06-01`; negócios de responsáveis classificados como `Outros` ficam fora do espelho operacional.
- O cliente atualiza a consulta a cada 5 minutos. Com uma aba administradora aberta e visível, também força a sincronização Bitrix → Supabase nesse intervalo.
- O botão Atualizar força a sincronização incremental para administradores; para os demais usuários, apenas recarrega o Supabase.
- No Vercel Hobby, o cron interno roda diariamente. A automação do navegador não executa com o painel fechado; cobertura contínua ainda depende do Supabase Cron ou de outro agendador externo.

## Próximos passos
- [ ] Confirmar `CRON_SECRET` em Production e Preview e executar novo deploy
- [ ] Configurar Supabase Cron a cada 5 minutos usando Vault + `pg_net`
- [ ] Monitorar `bitrix_sync_state` e reconciliar períodos divergentes quando necessário
- [ ] Endurecer proxy Bitrix (allowlist de métodos REST)

## Stack
- **Framework:** Next.js 16 (App Router + Turbopack), React 19
- **UI:** Tailwind CSS v4, lucide-react, Plus Jakarta Sans
- **Estado:** Zustand (filtros + layout) · **Dados:** TanStack Query v5
- **Auth e dados:** Supabase Auth/Postgres + @supabase/ssr + supabase-js
- **Gráficos:** Recharts + ApexCharts
- **Kanban DnD:** @dnd-kit
- **Export:** jsPDF + jspdf-autotable, xlsx-js-style
- **CRM:** Bitrix24 REST API · **Cache:** Redis/KV opcional · **Deploy:** Vercel
- **TypeScript** ~6.0 (strict a confirmar)

## Última atualização
2026-07-21
