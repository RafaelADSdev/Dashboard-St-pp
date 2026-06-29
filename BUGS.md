# Bugs

## 🐛 Abertos
> Nenhum bug funcional confirmado ainda. Itens abaixo são **riscos/dívidas** identificados na análise de 2026-06-29 (validar antes de tratar como bug).

- [ ] **Proxy Bitrix sem allowlist** — `src/app/api/bitrix/[...path]/route.ts` repassa qualquer método REST ao webhook. Usuário autenticado poderia chamar `crm.deal.delete` etc. Severidade: média/alta (depende de quem tem login).
- [ ] **RLS de `profiles` incompleta** — migration só define políticas de `SELECT`. Sem `INSERT`/`UPDATE`/`DELETE` explícitas (criação via service_role/seed). Confirmar se é intencional.
- [ ] **Sem lint configurado** — não há ESLint/script `lint`; regressões de qualidade passam despercebidas.

## ✅ Resolvidos
- (vazio)
