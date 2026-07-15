# Vercel CLI — variáveis Bitrix

Scripts para atualizar os webhooks do Bitrix24 na Vercel sem expor tokens no repositório.

## Pré-requisitos

```bash
npm i -g vercel
vercel login
vercel link    # na raiz do projeto (cria .vercel/, já no .gitignore)
```

## Atualizar webhook

**Windows (PowerShell):**

```powershell
.\vercel-cli\set-bitrix-webhook.ps1 "https://hubnogueira.bitrix24.com.br/rest/USER_ID/TOKEN/"
```

**Linux / macOS:**

```bash
chmod +x vercel-cli/set-bitrix-webhook.sh
./vercel-cli/set-bitrix-webhook.sh "https://hubnogueira.bitrix24.com.br/rest/USER_ID/TOKEN/"
```

O script atualiza `BITRIX_WEBHOOK_URL`, `BITRIX_WEBHOOK_URL_META` e `BITRIX_WEBHOOK_URL_DEALS` em **production**, **preview** e **development**, sincroniza `.env.local` e dispara redeploy em produção.

## Comandos úteis

```bash
vercel env ls
vercel env pull .env.local
vercel --prod --yes
```

## Segurança

- Nunca commite URLs de webhook ou `.env.local`
- Tokens vivem apenas na Vercel e no `.env.local` local (gitignored)
