param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$WebhookUrl
)

$webhook = $WebhookUrl.Trim()
if (-not $webhook.EndsWith("/")) {
  $webhook = "$webhook/"
}

$vars = @(
  "BITRIX_WEBHOOK_URL",
  "BITRIX_WEBHOOK_URL_META",
  "BITRIX_WEBHOOK_URL_DEALS"
)
$envs = @("production", "preview", "development")

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "Atualizando webhooks Bitrix na Vercel..." -ForegroundColor Cyan

foreach ($var in $vars) {
  foreach ($env in $envs) {
    & npx vercel env rm $var $env --yes 2>$null | Out-Null
    $webhook | & npx vercel env add $var $env 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Falha ao definir $var ($env)"
      exit 1
    }
  }
}

Write-Host "Sincronizando .env.local..." -ForegroundColor Cyan
& npx vercel env pull .env.local --yes 2>&1 | Out-Host

Write-Host "Redeploy em producao..." -ForegroundColor Cyan
& npx vercel --prod --yes 2>&1 | Out-Host

Write-Host "Concluido." -ForegroundColor Green
