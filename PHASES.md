# Fases

## ✅ Fase 0 — Produto em produção
- [x] Dashboard com KPIs, funis, evolução temporal
- [x] Filtros (período, esteira, diretoria, equipe, roleta) em modo rascunho→aplicar
- [x] Kanban operacional com DnD, modal de detalhes, transferência individual e em lote
- [x] Exportação PDF + Excel estruturado (HubON)
- [x] Auth Supabase + proxy Bitrix server-side
- [x] Deploy automático na Vercel
- [x] README completo
- [x] Espelho operacional Bitrix no Supabase
- [x] Dashboard e filtros lendo somente do Supabase
- [x] Backfill incremental desde 2026-06-01 e reconciliação por intervalo
- [x] Exclusão do escopo `Outros`/Nascimento
- [x] Atualização manual Bitrix → Supabase pelo botão para administradores
- [x] Atualização automática a cada 5 minutos enquanto uma aba administradora estiver aberta

## 🚧 Fase 1 — Hardening & qualidade (proposta — aguardando priorização)
- [ ] Endurecer proxy `/api/bitrix/*` (allowlist de métodos; hoje aceita qualquer REST method)
- [ ] ESLint + Prettier + script `lint` no package.json
- [ ] CI mínimo (GitHub Actions: typecheck + lint + build)
- [ ] Testes (Vitest) nos utils críticos (aggregateLeads, leadTiming, buildKanbanBoards)
- [ ] Revisar RLS/policies do Supabase (profiles só tem SELECT; sem INSERT/UPDATE)
- [ ] Error boundary / tratamento de erro consistente na UI
- [ ] Validar `CRON_SECRET` em todos os ambientes da Vercel e redeploy
- [ ] Configurar sincronização contínua a cada 5 minutos, inclusive com o dashboard fechado, fora do cron Hobby
- [ ] Criar alerta para `bitrix_sync_state.status = 'error'` ou dados defasados

## 🔮 Fase 2 — Evolução (ideias)
- [ ] Observabilidade (Sentry / Vercel Analytics)
- [ ] Cache mais inteligente / revalidação sob demanda
- [ ] Acessibilidade (WCAG) nos gráficos e Kanban
- [ ] Testes E2E (Playwright) nos fluxos críticos
