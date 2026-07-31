$env:NODE_ENV = "production"
$env:PORT = "3000"
$env:DATABASE_URL = "file:./prisma/dev.db"
$env:NEXTAUTH_SECRET = "atlas-oracle-dev-secret-change-in-prod"
$env:NEXTAUTH_URL = "http://localhost:3000"
$env:OPENAI_API_KEY = "sk-your-openai-api-key"

$proc = Start-Process -FilePath "node" -ArgumentList ".next/standalone/frontend/server.js" `
  -WorkingDirectory "C:\Users\EL GALACTICO15\atlas-oracle\frontend" `
  -RedirectStandardOutput "$env:TEMP\atlas-out.log" `
  -RedirectStandardError "$env:TEMP\atlas-err.log" `
  -PassThru

Start-Sleep -Seconds 4

Write-Host "=== Server Startup ==="
Get-Content "$env:TEMP\atlas-out.log" -ErrorAction SilentlyContinue

Write-Host "`n=== Health Check ==="
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 10
    Write-Host "Status: $($r.StatusCode) Content: $($r.Content)"
} catch {
    Write-Host "Health failed: $_"
}

Write-Host "`n=== Requesting Home ==="
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 10
    Write-Host "Status: $($r.StatusCode) Length: $($r.Content.Length)"
} catch {
    Write-Host "Home failed: $($_.Exception.Message)"
}

Start-Sleep -Seconds 2
Write-Host "`n=== Error Log ==="
Get-Content "$env:TEMP\atlas-err.log" -ErrorAction SilentlyContinue

$proc.Kill()
