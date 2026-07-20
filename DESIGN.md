---
name: Dashboard Stüpp
description: Painel operacional HubON — azul profundo institucional, densidade respeitosa, urgência semântica.
colors:
  midnight-indigo: "#212842"
  indigo-light: "#2a3252"
  indigo-lighter: "#323b5e"
  vanilla-cream: "#f0e7d5"
  cloud-white: "#f5f5f5"
  brand-600: "#212842"
  brand-700: "#1a2035"
  slate-ink: "#1e293b"
  emerald-success: "#059669"
  red-danger: "#dc2626"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.025em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brand-600}"
    textColor: "{colors.vanilla-cream}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.vanilla-cream}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  card-surface:
    backgroundColor: "{colors.cloud-white}"
    textColor: "{colors.midnight-indigo}"
    rounded: "{rounded.xl}"
    padding: "20px"
  nav-item-active:
    backgroundColor: "rgba(0,0,0,0.06)"
    textColor: "{colors.midnight-indigo}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: Dashboard Stüpp

## Overview

**Creative North Star: "O Posto de Comando"**

O Dashboard Stüpp é a sala de controle da superintendência comercial — não um produto SaaS genérico, mas um painel onde gestores enxergam gargalos e agem em segundos. A interface prioriza densidade informativa com hierarquia clara: números grandes para KPIs, tabelas e kanbans para operação, sidebar institucional em indigo profundo. O modo claro usa superfícies cloud/cream com texto midnight-indigo; o modo escuro inverte para fundos `#1a1f33` com texto cream, mantendo a mesma autoridade visual.

Rejeita explicitamente dashboards com fundo cream/sand pastel, gradientes decorativos, glassmorphism como estética principal, e qualquer coisa que pareça template de marketplace. A identidade HubON (azul profundo + neutros slate) ancora tudo; cor de acento aparece só em ações primárias e estados semânticos.

**Key Characteristics:**

- Densidade respeitosa — cards compactos (`p-5`), labels em uppercase tracking-wide, números tabulares
- Uma família tipográfica (Plus Jakarta Sans) em escala fixa rem, sem display fonts em UI
- Sidebar e header em camada neutra (`#f5f5f5` claro / `sidebar` escuro), conteúdo em cards cloud/branco
- Bordas sutis (`border-indigo/8`, `border-slate-200`) em vez de sombras pesadas
- Motion funcional: 150–250ms em hovers, animações de filtro/login com propósito, respeito a `prefers-reduced-motion`
- Semântica de urgência via verde → amarelo → laranja → vermelho (nunca decoração)

## Colors

Paleta institucional HubON: indigo profundo como âncora, cream/cloud como superfície de leitura, slate para dados e bordas, emerald/red para estados.

### Primary

- **Midnight Indigo** (`#212842`): Cor de marca, sidebar escura, botões primários (`bg-brand-600`), texto principal no modo claro. Transmite autoridade operacional.
- **Indigo Light** (`#2a3252`): Hover de sidebar, estados ativos no dark mode, gradientes do login.
- **Indigo Lighter** (`#323b5e`): Terceiro tom do gradiente institucional, acentos sutis.

### Secondary

- **Emerald Success** (`#059669` / `emerald-500–700`): KPIs positivos, roletas ativas, badges de status "ativa". Usado com fundo `emerald-50` ou `emerald-500/10` no dark.

### Tertiary

- **Red Danger** (`#dc2626` / `red-500–700`): Erros, alertas críticos, estados de falha. Sempre com fundo `red-50` ou `red-950/40` no dark.

### Neutral

- **Vanilla Cream** (`#f0e7d5`): Superfície de body no modo claro (`--surface`), texto de botões primários, seleção invertida.
- **Cloud White** (`#f5f5f5`): Cards KPI, sidebar clara, header. Fundo de conteúdo denso.
- **Slate Ink** (`#1e293b` / slate-800): Texto de gráficos, tabelas, descrições secundárias. Escala slate-50–900 para bordas e fundos alternados.

### Named Rules

**The Semantic Color Rule.** Cor carrega significado: indigo = marca e navegação; emerald = sucesso/ativo; red = erro/urgência crítica; slate = dados neutros. Nunca usar cor saturada em estado inativo ou decorativo.

**The No-Cream-Body Trap Rule.** O body claro é cream (`#f0e7d5`), mas cards e sidebar usam cloud (`#f5f5f5`) e branco — evitar que toda a tela pareça um bloco monocromático pastel. Contraste entre camadas é obrigatório.

## Typography

**Display Font:** Plus Jakarta Sans (Google Fonts, `--font-jakarta`)
**Body Font:** Plus Jakarta Sans (mesma família — produto, não editorial)
**Label/Mono Font:** Plus Jakarta Sans com `tabular-nums` para dados numéricos

**Character:** Geométrica-humanista, legível em densidade alta, sem floreios. Uma família, múltiplos pesos — confiança institucional sem parecer banco dos anos 90.

### Hierarchy

- **Display** (700, `text-3xl` / 1.875rem, leading tight): Valores de KPI (`KPICard`). `tabular-nums tracking-tight`.
- **Headline** (600, `text-base` / 1rem): Títulos de cards de gráfico (`ChartCard`), seções.
- **Title** (600, `text-sm` / 0.875rem): Itens de navegação, labels de botão, cabeçalhos de tabela.
- **Body** (400–500, `text-sm` / 0.875rem, leading 1.5): Texto corrido, descrições, células de tabela. Prosa longa: máx. 65–75ch.
- **Label** (600, `text-xs` / 0.75rem, `uppercase tracking-wide`): Rótulos de KPI, metadados, filtros de período.

### Named Rules

**The One Family Rule.** Plus Jakarta Sans em toda a UI. Sem serif, sem mono, sem display font em botões ou labels.

**The Tabular Data Rule.** Números operacionais (KPIs, contagens, datas) usam `tabular-nums` para alinhamento em colunas.

## Elevation

Sistema predominantemente flat com elevação por borda e tonalidade, não por sombra larga. Cards usam `border` sutil + `shadow-sm` no repouso, `shadow-md` no hover — nunca `border` + `shadow` com blur ≥16px no mesmo elemento (ghost-card proibido).

No dark mode, cards KPI usam `backdrop-blur-xl` com opacidade baixa — exceção pontual no login e KPI, não padrão global.

### Shadow Vocabulary

- **Card rest** (`box-shadow: 0 1px 2px rgba(0,0,0,0.05)`): Cards KPI, ChartCard, tabelas.
- **Card hover** (`box-shadow: 0 4px 6px rgba(0,0,0,0.07)`): Feedback de interação em cards clicáveis.
- **Modal** (`box-shadow: 0 25px 50px rgba(0,0,0,0.25)`): Modais e overlays de filtro.
- **Filter glow** (`0 20px 40px -12px rgba(33,40,66,0.2)`): Animação do overlay de aplicação de filtros.

### Named Rules

**The Flat-By-Default Rule.** Superfícies planas em repouso. Sombra aparece como resposta a hover ou elevação modal — nunca como decoração estática em toda a grade.

**The No Ghost Card Rule.** Proibido `border: 1px solid` + `box-shadow` com blur ≥16px no mesmo elemento.

## Components

### Buttons

- **Shape:** Cantos suaves (`rounded-lg` / 8px). Pills (`rounded-full`) só em chips de status.
- **Primary:** `bg-brand-600 text-cream`, hover `bg-brand-700`. Altura `h-9`, `text-sm font-semibold`, ícone Lucide 16px.
- **Secondary/Ghost:** `text-indigo/70`, hover `bg-black/5`. Sem borda no repouso.
- **Disabled:** `bg-slate-100 text-slate-400` (claro) / `bg-slate-800 text-slate-500` (escuro). Cursor `not-allowed`.
- **Loading:** `bg-blue-800` + `Loader2 animate-spin`. Estado explícito, nunca botão morto sem feedback.

### Chips

- **Style:** `rounded-full border px-3 py-1.5 text-xs font-semibold`. Status com dot colorido (`h-1.5 w-1.5 rounded-full`).
- **State:** Ativa = emerald; suspensa = slate; nova = blue. Filtros de período = toggle pill em `bg-blue-900` quando selecionado.

### Cards / Containers

- **Corner Style:** `rounded-2xl` (16px) — teto do projeto para cards.
- **Background:** `bg-cloud` (KPI) ou `bg-white` (gráficos/tabelas). Dark: `bg-cloud/5` ou `bg-slate-800/80`.
- **Border:** `border-indigo/8` (KPI) ou `border-slate-200/80` (charts).
- **Internal Padding:** `p-5` padrão.

### Inputs / Fields

- **Style:** `rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm`. Dark: `border-slate-600 bg-slate-800`.
- **Focus:** `focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15` (modais de acesso). Filtros: `focus:ring-brand-500/30`.
- **Error:** Borda e fundo red-50/red-200 com texto red-700.

### Navigation

- **Sidebar:** 260px expandida / 72px recolhida. Fundo `#f5f5f5` (claro) ou `bg-sidebar` (escuro). Item ativo: `bg-black/6 font-semibold`. Ícones Lucide 16px.
- **Header:** Sticky `z-30`, `backdrop-blur-md`, ações à direita (tema, filtros, atualizar, sair). Indicador de filtro pendente: dot `bg-brand-600` com ring.

### Kanban Card (assinatura)

- Colunas com cor de estágio via `getStageChartColor`. Cards arrastáveis com `GripVertical`, badges de tempo, modal de transferência. Erro em `border-red-200 bg-red-50`.

## Do's and Don'ts

### Do:

- **Do** usar `bg-brand-600` + `text-cream` para ações primárias (Atualizar, Aplicar, Exportar).
- **Do** manter densidade: KPIs com label uppercase 12px e valor 30px bold tabular.
- **Do** usar escala semântica verde → amarelo → laranja → vermelho para tempo sem atualização.
- **Do** confirmar ações com feedback visual (loading spinner, toast, estado disabled).
- **Do** respeitar `prefers-reduced-motion` em animações de entrada.

### Don't:

- **Don't** usar fundo cream/sand pastel em toda a superfície sem camadas cloud/branco — evita o visual "SaaS genérico" listado em PRODUCT.md.
- **Don't** aplicar gradientes decorativos ou glassmorphism como estética principal (exceção: login e overlay de filtro).
- **Don't** priorizar "parecer moderno" sobre densidade de informação útil.
- **Don't** usar `border-left` colorido >1px como acento em cards ou listas.
- **Don't** usar `rounded-3xl` ou superior em cards — teto é 16px.
- **Don't** parecer template de marketplace — consistência institucional HubON acima de trends.
