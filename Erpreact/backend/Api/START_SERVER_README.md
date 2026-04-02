# How to Start the API Server

## Permanent Solution for Port 5165 Conflict

This folder contains scripts to automatically handle port conflicts when starting the server.

## Quick Start Options:

### Option 1: Use PowerShell Script (Recommended)
```powershell
cd backend\Api
.\start-server.ps1
```

### Option 2: Use Batch File
```cmd
cd backend\Api
start-server.bat
```

### Option 3: Manual Kill and Start
```powershell
cd backend\Api
.\KILL_PORT.ps1
dotnet run
```

## What These Scripts Do:

1. **start-server.ps1** / **start-server.bat**: 
   - Automatically finds and kills any process using port 5165
   - Waits 2 seconds for cleanup
   - Starts the server with `dotnet run`

2. **KILL_PORT.ps1**:
   - Standalone script to kill processes on port 5165
   - Useful if you just need to free the port

## Alternative: Change Port (If conflicts persist)

If you want to use a different port permanently, edit `Properties/launchSettings.json` and change:
- `"applicationUrl": "http://localhost:5165"` to `"http://localhost:5166"` (or any other port)

Then update the frontend `.env` or `vite.config.js` to use the new port.

## Troubleshooting:

If scripts don't work:
1. Open Task Manager
2. Find "Api.exe" or "dotnet" processes
3. End them manually
4. Run the start script again
