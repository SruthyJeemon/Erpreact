# Script to kill all Api.exe processes and processes on port 5000
# Usage: .\KILL_ALL.ps1

$port = 5000
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Kill All API Processes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill Api.exe processes
Write-Host "Killing Api.exe processes..." -ForegroundColor Yellow
$apiProcesses = Get-Process -Name "Api" -ErrorAction SilentlyContinue
if ($apiProcesses) {
    foreach ($proc in $apiProcesses) {
        Write-Host "  -> Killing Api.exe (PID: $($proc.Id))" -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Api.exe processes killed!" -ForegroundColor Green
} else {
    Write-Host "No Api.exe processes found." -ForegroundColor Green
}

# Kill processes on port 5165
Write-Host ""
Write-Host "Killing processes on port $port..." -ForegroundColor Yellow
$processes = @()
$netstatOutput = netstat -ano | findstr ":$port"
if ($netstatOutput) {
    $processes = $netstatOutput | ForEach-Object {
        $line = $_ -split '\s+'
        $processId = $line[-1]
        if ($processId -match '^\d+$') {
            $processId
        }
    } | Select-Object -Unique
}

if ($processes -and $processes.Count -gt 0) {
    foreach ($processId in $processes) {
        try {
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  -> Killing PID $processId ($($proc.ProcessName))" -ForegroundColor Red
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            } else {
                taskkill /F /PID $processId >$null 2>&1
            }
        } catch {
            Write-Host "  -> Could not kill process $processId" -ForegroundColor DarkYellow
        }
    }
    Write-Host "Port $port processes killed!" -ForegroundColor Green
} else {
    Write-Host "No processes found on port $port." -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup complete! You can now start the server." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
