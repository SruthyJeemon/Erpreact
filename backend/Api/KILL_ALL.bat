@echo off
REM Batch file to kill all Api.exe processes and processes on port 5165

echo ========================================
echo   Kill All API Processes
echo ========================================
echo.

set PORT=5000

REM Kill Api.exe processes
echo Killing Api.exe processes...
taskkill /F /IM Api.exe >nul 2>&1
if %ERRORLEVEL%==0 (
    echo   -^> Api.exe processes killed!
) else (
    echo   -^> No Api.exe processes found
)

REM Kill processes on port 5165
echo.
echo Killing processes on port %PORT%...
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr LISTENING') do (
    echo   -^> Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
    set FOUND=1
)

if %FOUND%==1 (
    echo   -^> Port %PORT% processes killed!
) else (
    echo   -^> No processes found on port %PORT%
)

echo.
echo Cleanup complete! You can now start the server.
echo ========================================
pause
