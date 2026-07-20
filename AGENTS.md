# Agent Guidelines

## Design Context

Este projeto usa o skill **Impeccable** para decisões de design. Antes de alterar UI, leia:

- [`PRODUCT.md`](./PRODUCT.md) — register `product`, usuários (gestores Stüpp/HubON), propósito operacional, anti-referências e princípios estratégicos.
- [`DESIGN.md`](./DESIGN.md) — tokens visuais (indigo `#212842`, cream `#f0e7d5`, cloud `#f5f5f5`), tipografia Plus Jakarta Sans, componentes e regras de elevação.

**North Star:** "O Posto de Comando" — painel institucional denso, acionável, sem estética SaaS genérica.

**Regras rápidas:**
- Cor só carrega significado (indigo = marca, emerald = ativo, red = erro)
- Cards com `rounded-2xl` máximo; sem ghost-card (border + shadow larga)
- Uma família tipográfica; números com `tabular-nums`
- Anti-referências: cream pastel dominante, gradientes decorativos, glassmorphism, templates marketplace

**Comandos úteis:** `$impeccable critique <página>`, `$impeccable polish <componente>`, `$impeccable live` (config em `.impeccable/live/config.json`).
