# Diário

## 2026-07-21 — Dashboard operacional via Supabase
**Foco:** retirar o webhook Bitrix do caminho de leitura do dashboard e tornar filtros históricos previsíveis.

**Feito:**
- Criadas `bitrix_deals`, `bitrix_sync_snapshots` e `bitrix_sync_state` com RLS e acesso restrito à `service_role`.
- Implementado backfill desde `2026-06-01`, em janelas de até sete dias, com cursor persistente e incremental com sobreposição.
- `/api/dashboard`, organização e roletas passaram a consultar o Supabase mantendo o contrato usado pelo frontend.
- Filtros de período, esteira, diretoria, equipe, corretor e roleta passaram a ser aplicados no banco.
- Movimentações de fase e responsável continuam no Bitrix e atualizam o espelho após sucesso.
- Adicionada reconciliação protegida por intervalo (`from`/`to`).
- Negócios de responsáveis sem diretoria Stüpp nomeada (`Outros`) foram excluídos do escopo.
- Adicionados scripts em `vercel-cli/` para configurar Supabase, cron e redeploy sem commitar segredos.
- Botão Atualizar passou a sincronizar Bitrix → Supabase para administradores, com estado de carregamento, sucesso e erro.
- Uma aba administradora aberta e visível passou a disparar a mesma sincronização automaticamente a cada 5 minutos, com coordenação entre abas via `localStorage`.
- Cache de dashboard e roletas passou a incluir `bitrix_sync_state.completed_at`, garantindo leitura da nova versão após o sync.
- Criada rota `POST /api/admin/sync-bitrix` com revalidação de administrador, mesma origem e lock contra concorrência.

**Validação:**
- Build e typecheck concluídos durante a implementação.
- Migração remota aplicada e sincronização registrada como `success` no Supabase.
- Projeto Vercel identificado como `auzendegbrs-projects/dashboard-st-pp`; URL, chave pública e `service_role` já existiam nos ambientes.

**Pendências de deploy:**
- Confirmar `CRON_SECRET` em Production e Preview e disparar um novo deploy.
- O cron interno está diário por compatibilidade com o Vercel Hobby; configurar agendador externo para cumprir 5 minutos.
- Alternativa documentada para não assinar o Pro: Supabase Cron + Vault + `pg_net`.

---

## 2026-06-29 — Progressive Kanban Loading
**Foco:** Substituir o bloqueio total de carregamento nas páginas de esteira por loading progressivo.

**Feito:**
- Criado `/api/stages` endpoint — expõe `StageCatalog` (cache 24h, quase instantâneo)
- Criado `useKanbanStages` hook — busca etapas client-side com staleTime 24h
- Criado `KanbanSkeleton` component — colunas com nomes reais + skeleton cards animados
- Atualizado `KPICard` — prop `loading` para skeleton no valor enquanto carrega
- Atualizado `EsteiraEconomicoPage` e `EsteiraGeralPage` — sem bloqueio: header e KPI aparecem imediatamente, skeleton do kanban com etapas reais aparece enquanto dados carregam

**Fluxo de loading resultante:**
1. ~0ms — Header da página visível imediatamente
2. ~200ms — Skeleton kanban com nomes das etapas reais
3. ~7s — Kanban completo com todos os cards

**Próximos passos:**
- Testar visualmente o skeleton no browser

---

## 2026-06-29 — Fix combobox RoletaFilter (portal)
**Foco:** Corrigir dropdown do filtro de roleta que não aparecia por causa do `overflow-y-auto` do FilterPanel.

**Feito:**
- Diagnosticado: `FilterPanel` tem `overflow-y-auto` na div de conteúdo → clips filhos com `position: absolute`
- Fix: reescrito `RoletaFilter` com `createPortal(dropdown, document.body)` + `position: fixed` com `getBoundingClientRect()`
- Dropdown agora escapa do stacking context, aparece na posição certa sobre qualquer coisa

**Próximos passos:**
- Verificar visualmente o comportamento do dropdown no filtro

---

## 2026-06-29 — Análise inicial + setup .project/
**Foco:** Onboarding do projeto no sistema `.project/` via orquestrador; análise de qualidade e levantamento de melhorias.

**Feito:**
- Lido README (muito completo), package.json, .env.example e arquivos-chave (middleware, proxy Bitrix, route do dashboard, supabase middleware, migration profiles).
- Criada estrutura `.project/` com os 6 arquivos (CONTEXT, PHASES, DECISIONS, BUGS, DIARIO, ACESSOS).
- Decisões arquiteturais inferidas e registradas em DECISIONS.md.
- Levantado backlog de melhorias (hardening proxy, lint/CI, testes, RLS) em PHASES.md.

**Próximos passos:**
- Usuário priorizar quais melhorias atacar primeiro (segurança vs qualidade vs features).
- Conforme escolha: acionar `security-auditor` / `code-reviewer` / skill `supabase`.

**Bloqueios / dúvidas:**
- Confirmar se RLS incompleta de `profiles` é intencional.
- Confirmar quem tem acesso de login (define severidade do proxy aberto).

---
