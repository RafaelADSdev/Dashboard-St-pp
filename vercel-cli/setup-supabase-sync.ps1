param(
  [Parameter(Mandatory = $true)]
  [string]$ServiceRoleKey,

  [Parameter(Mandatory = $true)]
  [string]$CronSecret,

  [string]$SupabaseUrl = "",
  [string]$SupabaseAnonKey = "",
  [string]$SupabasePublishableKey = "",
  [string]$SyncStartDate = "2026-06-01",
  [string]$SyncOverlapMinutes = "60"
)

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not $SupabaseUrl) {
  $envFile = Join-Path $root ".env.local"
  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_URL=' } | Select-Object -First 1
    if ($line) {
      $SupabaseUrl = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
    }
  }
}

if (-not $SupabaseUrl) {
  $SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
}

if (-not $SupabaseUrl) {
  Write-Error "Informe -SupabaseUrl ou defina NEXT_PUBLIC_SUPABASE_URL no .env.local."
  exit 1
}

if (-not $SupabaseAnonKey -and -not $SupabasePublishableKey) {
  Write-Error "Informe -SupabaseAnonKey ou -SupabasePublishableKey"
  exit 1
}

$envs = @("production", "preview", "development")

function Set-VercelEnv {
  param(
    [string]$Name,
    [string]$Value,
    [string[]]$Targets
  )

  foreach ($env in $Targets) {
    & npx vercel env rm $Name $env --yes 2>$null | Out-Null
    $Value | & npx vercel env add $Name $env 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Falha ao definir $Name ($env)"
      exit 1
    }
  }
}

Write-Host "Configurando Supabase + sincronizacao Bitrix na Vercel..." -ForegroundColor Cyan

Set-VercelEnv -Name "NEXT_PUBLIC_SUPABASE_URL" -Value $SupabaseUrl -Targets $envs
if ($SupabaseAnonKey) {
  Set-VercelEnv -Name "NEXT_PUBLIC_SUPABASE_ANON_KEY" -Value $SupabaseAnonKey -Targets $envs
}
if ($SupabasePublishableKey) {
  Set-VercelEnv -Name "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" -Value $SupabasePublishableKey -Targets $envs
}
Set-VercelEnv -Name "SUPABASE_SERVICE_ROLE_KEY" -Value $ServiceRoleKey -Targets $envs
Set-VercelEnv -Name "CRON_SECRET" -Value $CronSecret -Targets $envs
Set-VercelEnv -Name "BITRIX_SYNC_START_DATE" -Value $SyncStartDate -Targets $envs
Set-VercelEnv -Name "BITRIX_SYNC_OVERLAP_MINUTES" -Value $SyncOverlapMinutes -Targets $envs

Write-Host "Sincronizando .env.local..." -ForegroundColor Cyan
& npx vercel env pull .env.local --yes 2>&1 | Out-Host

Write-Host "Redeploy em producao..." -ForegroundColor Cyan
& npx vercel --prod --yes 2>&1 | Out-Host

Write-Host "Concluido." -ForegroundColor Green
Write-Host "Dispare a primeira sincronizacao com:" -ForegroundColor Yellow
Write-Host 'curl -H "Authorization: Bearer SEU_CRON_SECRET" "https://dashboard-st-pp.vercel.app/api/cron/sync-bitrix"'
