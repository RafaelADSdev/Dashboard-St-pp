# Contexto — Dashboard Superintendência Stüpp

## O que é
Painel operacional Next.js que conecta ao CRM **Bitrix24** para acompanhar negociações (deals) da Superintendência Stüpp — KPIs, funis, evolução temporal, Kanban operacional com drag-and-drop, filtros (diretoria/equipe/roleta/esteira) e exportação PDF/Excel. Deploy em produção na Vercel.

## Estado atual
- **Em produção:** https://dashboard-st-pp.vercel.app
- App maduro e funcional, README muito completo.
- Auth via Supabase (login por nome de usuário → `usuario@stupp.dashboard`).
- Duas esteiras comerciais: Geral (cat. 16) e Econômico (cat. 64).
- Dados via proxy server-side seguro para o webhook Bitrix (`/api/bitrix/*`).

## Próximos passos
- [ ] Revisar com o usuário o backlog de melhorias proposto (ver `PHASES.md` / `DIARIO.md`)
- [ ] Decidir prioridade: segurança (proxy Bitrix), qualidade (lint/testes/CI) ou features
- [ ] Endurecer proxy Bitrix (allowlist de métodos REST)

## Stack
- **Framework:** Next.js 16 (App Router + Turbopack), React 19
- **UI:** Tailwind CSS v4, lucide-react, Plus Jakarta Sans
- **Estado:** Zustand (filtros + layout) · **Dados:** TanStack Query v5
- **Auth:** Supabase Auth + @supabase/ssr
- **Gráficos:** Recharts + ApexCharts
- **Kanban DnD:** @dnd-kit
- **Export:** jsPDF + jspdf-autotable, xlsx-js-style
- **CRM:** Bitrix24 REST API · **Deploy:** Vercel
- **TypeScript** ~6.0 (strict a confirmar)

## Última atualização
2026-06-29
