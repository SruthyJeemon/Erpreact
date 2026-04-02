# PowerShell script to start the API server
# This script automatically kills any process using port 5000 and Api.exe before starting

$port = 5000
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  API Server Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill Api.exe processes
Write-Host "Step 1: Checking for Api.exe processes..." -ForegroundColor Yellow
$apiProcesses = Get-Process -Name "Api" -ErrorAction SilentlyContinue
if ($apiProcesses) {
    Write-Host "Found $($apiProcesses.Count) Api.exe process(es). Terminating..." -ForegroundColor Red
    foreach ($proc in $apiProcesses) {
        Write-Host "  -> Terminating Api.exe (PID: $($proc.Id))" -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
} else {
    Write-Host "No Api.exe processes found." -ForegroundColor Green
}

# Step 2: Kill processes using port 5165
Write-Host ""
Write-Host "Step 2: Checking for processes using port $port..." -ForegroundColor Yellow

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
    Write-Host "Found $($processes.Count) process(es) using port $port. Terminating..." -ForegroundColor Red
    foreach ($processId in $processes) {
        try {
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  -> Terminating PID $processId ($($proc.ProcessName))" -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            } else {
                # Try to kill anyway using taskkill
                taskkill /F /PID $processId >$null 2>&1
            }
        } catch {
            Write-Host "  -> Warning: Could not terminate process $processId" -ForegroundColor DarkYellow
        }
    }
    Write-Host "Waiting 2 seconds for cleanup..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} else {
    Write-Host "Port $port is free." -ForegroundColor Green
}

# Step 3: Verify everything is clean
Write-Host ""
Write-Host "Step 3: Verifying cleanup..." -ForegroundColor Yellow
$stillApiRunning = Get-Process -Name "Api" -ErrorAction SilentlyContinue
$stillInUse = netstat -ano | findstr ":$port" | findstr LISTENING

if ($stillApiRunning -or $stillInUse) {
    Write-Host "Warning: Some processes may still be running. Trying to start anyway..." -ForegroundColor Red
    if ($stillApiRunning) {
        Write-Host "  -> Api.exe is still running. Attempting force kill..." -ForegroundColor Red
        taskkill /F /IM Api.exe >$null 2>&1
        Start-Sleep -Seconds 1
    }
} else {
    Write-Host "All processes cleaned up successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting API server on port $port..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Start the server
dotnet run
