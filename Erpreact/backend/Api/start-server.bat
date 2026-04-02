@echo off
REM Batch file to start the API server
REM This automatically kills Api.exe and processes using port 5165 before starting

echo ========================================
echo   API Server Startup Script
echo ========================================
echo.

set PORT=5000

REM Step 1: Kill Api.exe processes
echo Step 1: Killing Api.exe processes...
taskkill /F /IM Api.exe >nul 2>&1
if %ERRORLEVEL%==0 (
    echo   -^> Api.exe processes terminated
    timeout /t 1 /nobreak >nul
) else (
    echo   -^> No Api.exe processes found
)

REM Step 2: Kill processes using port 5165
echo.
echo Step 2: Checking for processes using port %PORT%...
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr LISTENING') do (
    echo   -^> Terminating process %%a...
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)

if %FOUND%==1 (
    echo Waiting 2 seconds for cleanup...
    timeout /t 2 /nobreak >nul
    echo Port %PORT% should now be free!
) else (
    echo Port %PORT% is free. Ready to start server.
)

echo.
echo Starting API server on port %PORT%...
echo Press Ctrl+C to stop the server
echo ========================================
echo.

dotnet run
