param(
  [string]$Host = "127.0.0.1",
  [int]$Port = 5173
)

$ErrorActionPreference = "Stop"

function Invoke-Npm([string[]]$ArgumentList) {
  & npm.cmd @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "npm command failed: npm $($ArgumentList -join " ")"
  }
}

Invoke-Npm @("install")

Write-Host "Starting meco-mission-control-web at http://$Host`:$Port ..."
$proc = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run", "dev", "--", "--host", $Host, "--port", "$Port" `
  -PassThru `
  -WindowStyle Hidden

Write-Host "Dev server started (PID: $($proc.Id))."
Write-Host "Browse to: http://$Host`:$Port"
