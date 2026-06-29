# Decisões Técnicas

> Registro inferido a partir do código/README em 2026-06-29 (decisões já tomadas pelo time, documentadas retroativamente).

## 2026-06 — Proxy server-side para o webhook Bitrix
**Contexto:** o webhook Bitrix carrega token de acesso total ao CRM; não pode ir ao bundle do cliente.
**Decisão:** rota `/api/bitrix/[...path]` faz proxy server-side; `BITRIX_WEBHOOK_URL` só existe no servidor.
**Alternativas:** chamar Bitrix direto do client (inseguro); backend separado (overkill).
**Consequências:** token protegido. ⚠️ Trade-off: o proxy repassa qualquer método REST — qualquer usuário autenticado pode chamar qualquer endpoint do Bitrix. Endurecer com allowlist (ver PHASES Fase 1).

## 2026-06 — Auth via Supabase com login por username
**Contexto:** usuários internos preferem login por nome, não e-mail.
**Decisão:** username convertido para `usuario@stupp.dashboard` internamente; Supabase Auth + @supabase/ssr; middleware protege `/api/*` e páginas.
**Alternativas:** Auth.js/NextAuth; auth próprio.
**Consequências:** sessão em cookies com renovação automática. Tabela `profiles` com role (admin/user).

## 2026-06 — Cache em camadas (unstable_cache)
**Contexto:** Bitrix tem rate limit; dashboard recarrega a cada 10s.
**Decisão:** org/fases/fontes/roletas cacheados 24h; resposta do dashboard 10s por combinação de filtros; split automático acima de 500 registros.
**Alternativas:** sem cache (estoura rate limit); cache externo (Redis — overkill).
**Consequências:** menos chamadas ao Bitrix; latência baixa. Cache atrelado ao runtime da Vercel.

## 2026-06 — Compatibilidade legada com variáveis VITE_*
**Contexto:** migração de um setup Vite anterior.
**Decisão:** aceitar `VITE_BITRIX_*` como fallback de `BITRIX_*`/`NEXT_PUBLIC_*`.
**Consequências:** transição suave; remover quando ambientes legados saírem.
