# Decisões Técnicas

> Registro inferido a partir do código/README em 2026-06-29 (decisões já tomadas pelo time, documentadas retroativamente).

## 2026-06 — Proxy server-side para o webhook Bitrix
**Contexto:** o webhook Bitrix carrega token de acesso total ao CRM; não pode ir ao bundle do cliente.
**Decisão:** rota `/api/bitrix/[...path]` faz proxy server-side; `BITRIX_WEBHOOK_URL` só existe no servidor.
**Alternativas:** chamar Bitrix direto do client (inseguro); backend separado (overkill).
**Consequências:** token protegido. ⚠️ Trade-off: o proxy repassa qualquer método REST — qualquer usuário autenticado pode chamar qualquer endpoint do Bitrix. Endurecer com allowlist (ver PHASES Fase 1).

## 2026-06 — Auth via Supabase com login por username
**Contexto:** usuários internos preferem login por nome, não e-mail.
**Decisão:** username convertido para `usuario@stupp.dashboard` internamente; Supabase Auth + @supabase/ssr; middleware protege APIs de usuário e páginas. A rota de cron usa `CRON_SECRET` próprio.
**Alternativas:** Auth.js/NextAuth; auth próprio.
**Consequências:** sessão em cookies com renovação automática. Tabela `profiles` com role (admin/user).

## 2026-06 — Cache em camadas (unstable_cache)
**Contexto:** Bitrix tem rate limit; dashboard recarrega a cada 10s.
**Decisão:** org/fases/fontes/roletas cacheados 24h; resposta do dashboard 10s por combinação de filtros; split automático acima de 500 registros.
**Alternativas:** sem cache (estoura rate limit); cache externo (Redis — overkill).
**Consequências:** decisão substituída em 2026-07 para dados operacionais. O cache curto continua existindo sobre consultas ao Supabase e pode usar Redis/KV distribuído.

## 2026-06 — Compatibilidade legada com variáveis VITE_*
**Contexto:** migração de um setup Vite anterior.
**Decisão:** aceitar `VITE_BITRIX_*` como fallback de `BITRIX_*`/`NEXT_PUBLIC_*`.
**Consequências:** transição suave; remover quando ambientes legados saírem.

## 2026-07 — Supabase como fonte operacional do dashboard
**Contexto:** consultar o Bitrix a cada filtro causava lentidão, limites de operação e divergências em períodos maiores.
**Decisão:** sincronizar deals e metadados para `bitrix_deals`, `bitrix_sync_snapshots` e `bitrix_sync_state`; `/api/dashboard`, `/api/org`, `/api/roletas` e estatísticas leem o Supabase via `service_role` server-side.
**Alternativas:** manter leitura direta do webhook; consultar Supabase diretamente no navegador.
**Consequências:** filtros ficam rápidos e previsíveis, o webhook não participa das leituras do dashboard e a disponibilidade depende da cobertura registrada em `bitrix_sync_state`.

## 2026-07 — Backfill incremental e reconciliação por intervalo
**Contexto:** o histórico não cabe com segurança em uma única execução serverless.
**Decisão:** processar janelas de até sete dias, persistir cursor, usar sobreposição incremental de 60 minutos e aceitar `from`/`to` para reconciliação protegida.
**Consequências:** cada execução continua automaticamente do ponto anterior. O dashboard rejeita datas anteriores a `coverage_start`, evitando resultados parciais silenciosos.

## 2026-07 — Escopo somente Stüpp com diretoria nomeada
**Contexto:** responsáveis de Nascimento apareciam como diretoria `Outros` e contaminavam os KPIs Stüpp.
**Decisão:** sincronizar e consultar somente usuários pertencentes a diretorias Stüpp nomeadas; excluir `Outros`.
**Consequências:** o Supabase pode conter somente o recorte operacional esperado e mudanças organizacionais exigem reconciliação do período afetado.

## 2026-07 — Agendamento compatível com Vercel Hobby
**Contexto:** o cron de 5 em 5 minutos não é aceito no plano Hobby.
**Decisão:** manter `vercel.json` com execução diária às 05:00 UTC e documentar agendador externo para frequência de 5 minutos.
**Consequências:** sem agendador externo ou upgrade, o banco atualiza diariamente, embora o cliente consulte o Supabase a cada 5 minutos.
