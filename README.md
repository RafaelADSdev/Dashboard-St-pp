# Dashboard Superintendência Stüpp

Painel operacional para acompanhar negociações, esteiras comerciais e **roletas de distribuição** do **Bitrix24** da Superintendência Stüpp — com KPIs, funis, kanban, filtros organizacionais e exportação de relatórios.

| | |
|---|---|
| **Produção** | [dashboard-st-pp.vercel.app](https://dashboard-st-pp.vercel.app) |
| **Repositório** | [https://github.com/Hub-On-Tecnologia/dashboard-stupp/tree/master](https://github.com/Hub-On-Tecnologia/dashboard-stupp/tree/master) |
| **Stack** | Next.js 16 · React 19 · Tailwind v4 · Supabase Auth · Bitrix24 REST |

---

## Início rápido

```bash
git clone https://github.com/Hub-On-Tecnologia/dashboard-stupp/tree/master
cd Dashboard-St-pp
npm install
cp .env.example .env.local   # preencha o webhook Bitrix e o Supabase
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Para criar o primeiro usuário admin:

```bash
npm run seed:admin
```

Credenciais padrão do seed: usuário `admin` / senha `admin123` (altere após o primeiro acesso).

---

## Sumário

- [Páginas do painel](#páginas-do-painel)
- [Funcionalidades](#funcionalidades)
- [Integração Bitrix24](#integração-bitrix24)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuração local](#configuração-local)
- [Deploy na Vercel](#deploy-na-vercel)
- [API interna](#api-interna)
- [Filtros](#filtros)
- [Exportação](#exportação-de-relatórios)
- [Kanban operacional](#kanban-operacional)
- [Performance e confiabilidade](#performance-e-confiabilidade)
- [Segurança](#segurança)
- [Solução de problemas](#solução-de-problemas)
- [Scripts](#scripts-disponíveis)

---

## Páginas do painel

| Rota | Descrição |
|------|-----------|
| `/` | Visão geral — KPIs das duas esteiras, funis, evolução, leads por diretoria/fonte |
| `/esteira-geral` | Comercial Geral (category `16`) + kanban operacional |
| `/esteira-economico` | Comercial Econômico (category `64`) + kanban operacional |
| `/roletas` | Catálogo de roletas Stüpp, KPIs por status e gestão de corretores |

Todas as rotas exigem login (Supabase Auth). O acesso ao Bitrix é feito pelo servidor via webhook — o usuário do dashboard **não** precisa de credenciais Bitrix.

---

## Funcionalidades

### Dashboard e análises

- KPIs consolidados das esteiras Comercial Geral e Comercial Econômico
- Funis comerciais, evolução temporal e distribuição por diretoria, equipe e fonte (`SOURCE_ID`)
- Gráficos interativos com suporte a modo claro/escuro
- Atualização automática dos dados a cada **10 segundos**

### Kanban operacional (esteiras)

Disponível em `/esteira-geral` e `/esteira-economico`:

- Colunas alinhadas às fases do funil Bitrix
- Arrastar e soltar para mudar fase (`crm.deal.update`)
- Modal com detalhes do lead, transferência individual e em lote
- Datas de chegada e última movimentação por esteira (campos Bitrix específicos)

### Roletas (`/roletas`)

Gestão e visão do catálogo de roletas Stüpp (SPA Bitrix, entity **129**):

- KPIs: roletas ativas, novas, suspensas e leads no período
- Filtros do catálogo com modo **rascunho → Aplicar filtros**:
  - Busca por corretor Stüpp
  - Diretoria e liderança (via corretores cadastrados na roleta)
  - Nome da roleta e status (ativa / nova / suspensa)
- Lista expandível por roleta com:
  - Alteração de status no kanban Bitrix
  - Corretores agrupados por liderança
  - Adicionar e remover corretores (entity **186** — aba “Corretores da roleta”)

### Filtros gerais (drawer lateral)

Presentes em todas as páginas principais:

| Filtro | Comportamento |
|--------|---------------|
| Período | Intervalo customizável (padrão: últimos 7 dias) |
| Esteira | Todas, Comercial Geral ou Comercial Econômico |
| Diretoria / Equipe / Corretor | Recorte pela estrutura org da Stüpp |
| Roleta | **Somente roletas ativas** (status `ativa` no kanban) |

Fluxo: ajuste os campos → **Aplicar filtros** → dados recarregam com feedback visual. Use **Limpar filtros** para voltar ao padrão.

### Exportação

Botão **Exportar** no header — PDF ou Excel com os filtros aplicados na página atual:

- Excel estruturado (Resumo, Detalhamento lead a lead, Evolução, abas por seção)
- PDF tabular por seções
- Leads ordenados pelos mais parados primeiro
- Identidade visual HubON

### Interface

- Modo claro/escuro (preferência salva no navegador)
- Sidebar recolhível com marcas Stüpp | HubON
- Painel de filtros em drawer lateral
- Tipografia Plus Jakarta Sans, paleta azul institucional

---

## Integração Bitrix24

### Esteiras comerciais (deals)

| Esteira | Category ID | Variável de ambiente |
|---------|-------------|----------------------|
| Comercial Geral | `16` | `NEXT_PUBLIC_BITRIX_ESTEIRA_GERAL_ID` |
| Comercial Econômico | `64` | `NEXT_PUBLIC_BITRIX_ESTEIRA_ECONOMICO_ID` |

### Roletas (SPA)

| Recurso | Entity / ID | Detalhe |
|---------|-------------|---------|
| Roletas | Entity **129**, category **20** | Kanban: Nova → Ativa → Suspensa |
| Corretores da roleta | Entity **186** | Vinculados pelo nome da roleta (`ufCrm11_1738081783`) |
| Campo roleta no deal | `UF_CRM_1734703374` | Usado nos filtros e cards do kanban |

Status operacionais: `ativa`, `nova`, `suspensa` — classificados a partir do estágio do kanban Bitrix.

### Estrutura organizacional

```
SUPERINTENDÊNCIA STÜPP (ID 3)
└── COMERCIAL-S (ID 60)
    ├── SANTOS · MONTEIRO · GEORGII · TALMON
    ├── STÜPP · HENRIQUE · SEVERO
    └── Equipes e sub-equipes (Líderes / LT)
```

Filtros de diretoria, equipe e corretor mapeiam `ASSIGNED_BY_ID` dos deals à árvore de departamentos.

### Webhooks

O token do Bitrix **nunca** vai para o navegador. Todas as chamadas passam pelas API Routes do Next.js.

| Variável | Uso |
|----------|-----|
| `BITRIX_WEBHOOK_URL` | Webhook principal (obrigatório) |
| `BITRIX_WEBHOOK_URL_META` | Org, roletas, metadados (opcional — reduz carga) |
| `BITRIX_WEBHOOK_URL_DEALS` | Listagem e mutação de deals (opcional) |
| `BITRIX_PAUSED=true` | Pausa todas as chamadas ao Bitrix (manutenção) |

> Recomendado: criar webhooks extras no Bitrix (Aplicativos → Webhooks de entrada) com permissão CRM para distribuir carga e evitar `operation time limit`.

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router + Turbopack) |
| UI | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) + [next-themes](https://github.com/pacocoursey/next-themes) |
| Estado | [Zustand](https://zustand.docs.pmnd.rs/) |
| Dados | [TanStack Query v5](https://tanstack.com/query) |
| Kanban | [@dnd-kit](https://dndkit.com/) |
| Auth | [Supabase Auth](https://supabase.com/docs/guides/auth) + `@supabase/ssr` |
| Gráficos | [Recharts](https://recharts.org/) + [ApexCharts](https://apexcharts.com/) |
| Exportação | jsPDF, jspdf-autotable, xlsx-js-style |
| Deploy | [Vercel](https://vercel.com/) |
| CRM | [Bitrix24 REST API](https://apidocs.bitrix24.com/) |

---

## Arquitetura

```mermaid
flowchart LR
    subgraph Browser
        LOGIN[Tela de login]
        UI[Dashboard UI]
        RQ[TanStack Query]
    end

    subgraph Vercel
        AUTH[Supabase Auth]
        API_DASH["/api/dashboard"]
        API_DEALS["/api/deals/*"]
        API_ORG["/api/org"]
        API_ROL["/api/roletas/*"]
        CACHE[(unstable_cache)]
        PROXY["/api/bitrix/*"]
    end

    subgraph Bitrix24
        CRM[Deals + Users + Departments]
        SPA[Roletas SPA · 129]
        CORR[Corretores roleta · 186]
    end

    LOGIN --> AUTH
    AUTH --> UI
    UI --> RQ
    RQ --> API_DASH
    RQ --> API_DEALS
    RQ --> API_ORG
    RQ --> API_ROL
    API_DASH --> CACHE
    API_ORG --> CACHE
    API_ROL --> CACHE
    CACHE --> PROXY
    PROXY --> CRM
    PROXY --> SPA
    PROXY --> CORR
```

### Fluxo de dados

1. Login via Supabase Auth (middleware protege rotas e APIs).
2. Cliente chama `/api/dashboard` ou `/api/roletas/stats` com filtros aplicados.
3. Servidor usa cache (`unstable_cache`) para org, fases, fontes e catálogo de roletas.
4. Deals e contagens são buscados em paralelo no Bitrix; volumes grandes usam **split automático** por esteira e intervalo de datas.
5. Agregação no servidor (`aggregateLeadsData`, `buildRoletasData`) → JSON pronto para UI e exportação.

---

## Estrutura do projeto

```
src/
├── app/
│   ├── api/
│   │   ├── bitrix/[...path]/     # Proxy seguro ao webhook
│   │   ├── dashboard/            # Dados agregados do painel
│   │   ├── deals/                # Mover fase e transferir corretor
│   │   ├── org/                  # Estrutura organizacional
│   │   └── roletas/              # Catálogo, stats, status e corretores
│   ├── (protected)/roletas/      # Página de roletas
│   ├── esteira-geral/
│   └── esteira-economico/
├── api/                          # Clientes Bitrix (deals, roletas, org)
├── components/
│   ├── charts/                   # Funis, evolução, diretoria, origem
│   ├── filters/                  # Filtros gerais + RoletaFilter (só ativas)
│   ├── kanban/                   # LeadsKanbanBoard
│   ├── roletas/                  # Lista, gestão, filtros do catálogo
│   └── layout/                   # Sidebar, Header, ExportButton
├── hooks/                        # useLeadsData, useRoletasData, useStuppOrg...
├── lib/
│   ├── roletaStatus.ts           # Classificação ativa/nova/suspensa
│   ├── bitrixDealDates.ts        # Datas do kanban por esteira
│   └── server/                   # Cache, buildDashboardData, webhooks
├── screens/                      # DashboardPage, Esteira*, RoletasPage
├── store/                        # filterStore (rascunho vs aplicado)
└── utils/                        # Agregação, exportação, filtros de roletas
lib/supabase/                     # Clientes browser/server + middleware
scripts/seed-admin.mjs            # Usuário admin inicial
supabase/migrations/              # Profiles e políticas RLS
```

---

## Configuração local

### Pré-requisitos

- **Node.js** 20+
- **npm** 9+
- Webhook Bitrix24 com permissões CRM:
  - `crm.deal.list`, `crm.deal.update`, `crm.status.list`
  - `crm.dealcategory.stage.list`, `crm.item.list`, `crm.item.add`, `crm.item.update`, `crm.item.delete`
  - `department.get`, `user.get`
- Projeto Supabase com Auth habilitado

### Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
# Obrigatório — webhook Bitrix (somente servidor)
BITRIX_WEBHOOK_URL=https://seu-portal.bitrix24.com.br/rest/USER_ID/TOKEN/

# Opcional — distribui carga entre webhooks
BITRIX_WEBHOOK_URL_META=https://seu-portal.bitrix24.com.br/rest/1/XXXX/
BITRIX_WEBHOOK_URL_DEALS=https://seu-portal.bitrix24.com.br/rest/2/YYYY/

# Pausar integração (manutenção)
# BITRIX_PAUSED=true

# Esteiras
NEXT_PUBLIC_BITRIX_ESTEIRA_GERAL_ID=16
NEXT_PUBLIC_BITRIX_ESTEIRA_ECONOMICO_ID=64
NEXT_PUBLIC_BITRIX_ROLETA_CATEGORY_ID=20

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon

# Apenas servidor — seed:admin (nunca expor no client)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

**Autenticação:** login com **nome de usuário** (convertido internamente para `usuario@stupp.dashboard`). Aplique as migrations em `supabase/migrations/` antes do primeiro acesso.

**Compatibilidade legada:** também aceita `VITE_BITRIX_WEBHOOK_URL` e `VITE_BITRIX_ESTEIRA_*`.

### Comandos

```bash
npm run dev        # Desenvolvimento — http://localhost:3000
npm run build      # Build de produção
npm start          # Servidor de produção
npm run typecheck  # Verificação TypeScript
npm run seed:admin # Cria usuário admin no Supabase
```

---

## Deploy na Vercel

1. Conecte o repositório à [Vercel](https://vercel.com/)
2. Configure em **Settings → Environment Variables**:

| Variável | Obrigatória | Sensível |
|----------|-------------|----------|
| `BITRIX_WEBHOOK_URL` | Sim | Sim |
| `BITRIX_WEBHOOK_URL_META` | Não | Sim |
| `BITRIX_WEBHOOK_URL_DEALS` | Não | Sim |
| `NEXT_PUBLIC_BITRIX_ESTEIRA_GERAL_ID` | Sim | Não |
| `NEXT_PUBLIC_BITRIX_ESTEIRA_ECONOMICO_ID` | Sim | Não |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Não |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Não |

3. Deploy automático via push na branch principal, ou manual:

```bash
npx vercel --prod
```

---

## API interna

Todas as rotas exigem sessão Supabase válida.

### `GET /api/org`

Estrutura organizacional (diretorias, equipes, corretores). Cache: **24 h**.

### `GET /api/roletas`

Catálogo completo de roletas Stüpp com corretores e vínculos org. Cache: **24 h**.

### `GET /api/roletas/stats`

Estatísticas de leads por roleta no período. Parâmetros: `dateFrom`, `dateTo`, `diretoria`, `equipe`, `corretor`.

### `POST /api/roletas/[id]/status`

Altera status da roleta no kanban Bitrix.

```json
{ "status": "ativa" }
```

Valores: `ativa`, `nova`, `suspensa`.

### `POST /api/roletas/[id]/corretores`

Adiciona corretor à roleta.

```json
{ "corretorUserId": "123", "corretorName": "Nome", "roletaTitle": "Roleta X" }
```

### `DELETE /api/roletas/[id]/corretores`

Remove corretor. Query: `?recordId=456`.

### `GET /api/dashboard`

Dados agregados do painel.

| Parâmetro | Descrição |
|-----------|-----------|
| `dateFrom`, `dateTo` | `YYYY-MM-DD` (obrigatórios) |
| `esteira` | `TODAS` \| `GERAL` \| `ECONOMICO` |
| `diretoria`, `equipe`, `corretor`, `roleta` | IDs (vazio = todos) |

Resposta inclui KPIs, `byDiretoria`, `byTeam`, `byStage`, `bySource`, funis, `overTime`, `kanbanBoards`, `leadDetails`. Cache: **10 s** por combinação de filtros.

### `POST /api/deals/stage`

```json
{ "dealId": "123", "stageId": "C16:NEW" }
```

### `POST /api/deals/assign`

```json
{ "dealId": "123", "assignedById": "456" }
```

### `POST /api/deals/assign/batch`

```json
{ "dealIds": ["123", "456"], "assignedById": "789" }
```

---

## Exportação de relatórios

| Formato | Conteúdo |
|---------|----------|
| **Excel** | Resumo + Detalhamento (lead a lead) + Evolução + seções com ranking e `%` |
| **PDF** | Relatório tabular por seções com filtros no topo |

Cada lead exportado inclui tempo na esteira, última atualização e tempo sem atualizar. Linhas com valor `0` são omitidas nas seções agregadas.

---

## Kanban operacional

| Ação | Como usar |
|------|-----------|
| Ver detalhes | Clique no card |
| Mudar fase | Arraste para outra coluna |
| Transferir um lead | Modal → escolher corretor |
| Transferir em lote | Selecionar em lote → marcar cards → Transferir |

### Datas nos cards

| Esteira | Chegou ao corretor | Última movimentação |
|---------|-------------------|---------------------|
| **Econômico** | `DATE_CREATE` | `DATE_MODIFY` + modificado por |
| **Geral** | `UF_CRM_1738332137` ou Data de Entrada | Maior data entre fases `UF_CRM_173833*` ou `MOVED_TIME` |

Detalhes em `src/lib/bitrixDealDates.ts`.

---

## Performance e confiabilidade

| Estratégia | Detalhe |
|------------|---------|
| API única por tela | Uma requisição HTTP por carregamento de dashboard |
| Cache longo | Org, fases, fontes e catálogo de roletas — **24 h** |
| Cache curto | Dashboard agregado — **10 s** |
| Filtro no Bitrix | `ASSIGNED_BY_ID` e roleta enviados na query quando aplicável |
| Split de volume | Acima de 500 registros: divisão por esteira e datas |
| Retry | Requisições repetidas em rate limit ou timeout |
| `placeholderData` | Dados anteriores visíveis enquanto novos filtros carregam |
| Pausa de emergência | `BITRIX_PAUSED=true` interrompe chamadas sem derrubar o app |

---

## Segurança

- **Painel** — Supabase Auth + middleware em rotas e APIs
- **Bitrix** — webhook somente no servidor; token nunca no bundle do cliente
- Sessão em cookies via `@supabase/ssr` com renovação automática
- `.env` no `.gitignore` — nunca commitar webhooks ou `service_role`
- Mutações de roletas invalidam cache via `revalidateTag`

---

## Solução de problemas

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Catálogo de roletas vazio | `categoryId` incorreto ou webhook sem `crm.item.list` | Confirme `NEXT_PUBLIC_BITRIX_ROLETA_CATEGORY_ID=20` |
| `operation time limit` | Bitrix sobrecarregado | Configure webhooks extras (`_META`, `_DEALS`); aguarde e tente de novo |
| Integração pausada | `BITRIX_PAUSED=true` | Remova a variável e faça redeploy |
| Filtro de liderança sem resultados | Roleta sem corretores na entity 186 | Cadastre corretores na aba “Corretores da roleta” no Bitrix |
| Login não funciona | Migrations ou usuário não criado | Rode `npm run seed:admin` e verifique Supabase URL/keys |
| Porta 3000 em uso | Outro processo Node | Encerre o processo anterior ou use outra porta no `dev` |

---

## Scripts disponíveis

```bash
npm run dev        # Servidor de desenvolvimento (porta 3000)
npm run build      # Build de produção
npm start          # Servidor de produção
npm run typecheck  # Verificação TypeScript
npm run seed:admin # Cria usuário admin no Supabase
```

---

## Licença

Projeto privado — uso interno da Superintendência Stüpp / HubON.
