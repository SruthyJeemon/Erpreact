# Quick script to kill processes on port 5000
# Usage: .\KILL_PORT.ps1

$port = 5000
Write-Host "Killing processes on port $port..." -ForegroundColor Yellow

$processes = netstat -ano | findstr ":$port" | ForEach-Object {
    $line = $_ -split '\s+'
    $processId = $line[-1]
    if ($processId -match '^\d+$') {
        $processId
    }
} | Select-Object -Unique

if ($processes) {
    foreach ($processId in $processes) {
        try {
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Killing process: $processId ($($proc.ProcessName))" -ForegroundColor Red
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        } catch {
            Write-Host "Error killing process $processId" -ForegroundColor Red
        }
    }
    Write-Host "Port $port is now free!" -ForegroundColor Green
} else {
    Write-Host "No processes found on port $port" -ForegroundColor Green
}
