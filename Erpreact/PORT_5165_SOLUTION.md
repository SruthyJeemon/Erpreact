# Permanent Solution for Port 5000 Conflict & Api.exe Lock

## Problem
The API server fails to start because:
1. Port 5000 is already in use by a previous instance
2. Api.exe is locked and cannot be rebuilt

## Permanent Solutions

### Solution 1: Use the Startup Scripts (Recommended)

I've created automatic startup scripts that kill **both Api.exe processes AND processes on port 5000** before starting:

**PowerShell (Recommended):**
```powershell
cd backend\Api
.\start-server.ps1
```

**Batch File:**
```cmd
cd backend\Api
start-server.bat
```

These scripts will:
1. Kill all Api.exe processes
2. Kill processes using port 5000
3. Wait for cleanup
4. Start the server

### Solution 2: Quick Kill Scripts

**Kill everything (Api.exe + Port 5000):**
```powershell
cd backend\Api
.\KILL_ALL.ps1
```

Or using batch file:
```cmd
cd backend\Api
KILL_ALL.bat
```

**Kill only port 5000:**
```powershell
cd backend\Api
.\KILL_PORT.ps1
```

Then start normally:
```powershell
dotnet run
```

### Solution 3: Change the Port (Alternative)

If conflicts persist, you can change the port permanently:

1. Edit `backend/Api/Properties/launchSettings.json`:
   - Change `"applicationUrl": "http://localhost:5000"` to `"http://localhost:5166"`

2. Update frontend API URL:
   - Edit `frontend/.env` or set `VITE_API_URL=http://localhost:5166`
   - Or update `frontend/src/components/LoginForm.jsx` and other files that use the API URL

### Solution 4: Manual Process Kill

If scripts don't work:
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to "Details" tab
3. Find "Api.exe" or "dotnet.exe" processes
4. Right-click → End Task
5. Start the server again

## Best Practice

**Always use the startup scripts** (`start-server.ps1` or `start-server.bat`) instead of running `dotnet run` directly. This ensures the port is always free before starting.

## Files Created

- `backend/Api/start-server.ps1` - PowerShell startup script (kills Api.exe + port 5000)
- `backend/Api/start-server.bat` - Batch file startup script (kills Api.exe + port 5000)
- `backend/Api/KILL_ALL.ps1` - Kill all Api.exe and port 5000 processes (PowerShell)
- `backend/Api/KILL_ALL.bat` - Kill all Api.exe and port 5000 processes (Batch)
- `backend/Api/KILL_PORT.ps1` - Quick port 5000 cleanup script
- `backend/Api/START_SERVER_README.md` - Detailed instructions

## Usage Example

```powershell
# Navigate to API directory
cd backend\Api

# Run the startup script (automatically handles port conflicts)
.\start-server.ps1
```

The server will start successfully every time!
