# Quick Start Guide - API Server

## 🚀 Always Use These Commands

### To Start the Server (Recommended):
```powershell
cd backend\Api
.\start-server.ps1
```

This will:
- ✅ Kill all Api.exe processes
- ✅ Kill processes on port 5000
- ✅ Start the server automatically

### If Server Won't Start (Kill Everything First):
```powershell
cd backend\Api
.\KILL_ALL.ps1
```

Then start:
```powershell
dotnet run
```

## 📋 Available Scripts

| Script | Purpose |
|--------|---------|
| `start-server.ps1` | **Use this!** Kills Api.exe + port 5000, then starts server |
| `start-server.bat` | Same as above, but batch file |
| `KILL_ALL.ps1` | Kill Api.exe + port 5000 (doesn't start server) |
| `KILL_ALL.bat` | Same as above, but batch file |
| `KILL_PORT.ps1` | Kill only port 5000 processes |

## ⚠️ Common Errors Fixed

1. **"Port 5000 already in use"** → Use `start-server.ps1`
2. **"Api.exe is locked"** → Use `start-server.ps1` or `KILL_ALL.ps1`
3. **"Cannot copy apphost.exe"** → Use `KILL_ALL.ps1` first

## 💡 Pro Tip

**Always use `start-server.ps1` instead of `dotnet run` directly!**

This ensures the port is always free before starting.
