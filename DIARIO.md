# Diário

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
