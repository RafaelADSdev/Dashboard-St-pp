# Bugs

## 🐛 Abertos
> Nenhum bug funcional confirmado ainda. Itens abaixo são **riscos/dívidas** identificados na análise de 2026-06-29 (validar antes de tratar como bug).

- [ ] **Proxy Bitrix sem allowlist** — `src/app/api/bitrix/[...path]/route.ts` repassa qualquer método REST ao webhook. Usuário autenticado poderia chamar `crm.deal.delete` etc. Severidade: média/alta (depende de quem tem login).
- [ ] **RLS de `profiles` incompleta** — migration só define políticas de `SELECT`. Sem `INSERT`/`UPDATE`/`DELETE` explícitas (criação via service_role/seed). Confirmar se é intencional.
- [ ] **Sem lint configurado** — não há ESLint/script `lint`; regressões de qualidade passam despercebidas.
- [ ] **Frequência de sync abaixo do objetivo** — o `vercel.json` usa cron diário para ser aceito no Hobby. Para atualização real a cada 5 minutos, falta agendador externo ou plano Vercel compatível.
- [ ] **Deploy precisa validar o cron** — confirmar `CRON_SECRET` em Production/Preview e executar um novo deploy antes de considerar a sincronização automática concluída.

## ✅ Resolvidos
- [x] **Dashboard dependia do webhook para leitura** — dados operacionais agora são consultados no Supabase.
- [x] **Filtro histórico quebrava sem cobertura explícita** — API valida `coverage_start` e retorna erro descritivo para períodos ainda não sincronizados.
- [x] **Leads de Nascimento em `Outros`** — sincronização e consultas limitadas às diretorias Stüpp nomeadas.
- [x] **Divergência após mudanças organizacionais** — rota de cron aceita reconciliação protegida com `from` e `to`.
