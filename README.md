# React ERP Login System

This is a full-stack login application with React frontend and ASP.NET Core backend.

## Prerequisites

Before running the project, ensure you have the following installed:

1. **.NET SDK 9.0** - [Download here](https://dotnet.microsoft.com/download)
2. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
3. **SQL Server** (SQL Server Express or higher) - Should be running on `DESKTOP-GANSHQJ\SQLEXPRESS`
4. **Database**: `123` with table `Tbl_Login` and stored procedure `Sp_Login`

## Project Structure

```
Reactjserp/
├── backend/          # ASP.NET Core API (C#)
│   └── Api/
└── frontend/         # React + Vite application
    └── src/
```

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend/Api
   ```

2. Restore NuGet packages (if not already done):
   ```bash
   dotnet restore
   ```

3. Verify the connection string in `appsettings.json`:
   - The connection string is already configured:
   ```
   Data Source=DESKTOP-GANSHQJ\SQLEXPRESS;Initial Catalog=123;Integrated Security=True;Encrypt=False;Max Pool Size=100
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

## Running the Project

### Step 1: Start the Backend API

Open a terminal/command prompt and run:

```bash
cd backend/Api
dotnet run
```

The API will start on:
- **HTTP**: `http://localhost:5165`
- **HTTPS**: `https://localhost:7187`

You should see output like:
```
Now listening on: http://localhost:5165
Now listening on: https://localhost:7187
```

**Keep this terminal open!**

### Step 2: Start the Frontend (React App)

Open a **new terminal/command prompt** and run:

```bash
cd frontend
npm run dev
```

The React app will start on:
- **URL**: `http://localhost:5173`

You should see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Access the Application

1. Open your web browser
2. Navigate to: `http://localhost:5173`
3. You should see the login form

## Testing the Login

1. Make sure you have a user in your `Tbl_Login` table with:
   - Valid email address
   - Password (will be hashed with MD5)
   - Status = "Active"

2. Enter the credentials in the login form
3. Click "Sign In"

## Troubleshooting

### Backend Issues

**Problem**: SQL Server connection error
- **Solution**: Make sure SQL Server is running and accessible
- Check the connection string in `appsettings.json`
- Verify the database `db_aa32dc_erpberam` exists

**Problem**: Port already in use
- **Solution**: Change the port in `Properties/launchSettings.json` or stop the process using that port

**Problem**: Stored procedure not found
- **Solution**: Ensure `Sp_Login` stored procedure exists in the database

### Frontend Issues

**Problem**: CORS error
- **Solution**: The CORS is already configured in the backend for `http://localhost:5173` and `http://localhost:5174`

**Problem**: API connection failed
- **Solution**: 
  - Make sure the backend is running
  - Check if the API URL in `LoginForm.jsx` matches your backend URL
  - For HTTP: `http://localhost:5165`
  - For HTTPS: `https://localhost:7187`

**Problem**: npm install fails
- **Solution**: 
  ```bash
  npm cache clean --force
  npm install
  ```

## Available Scripts

### Backend
- `dotnet run` - Run the API
- `dotnet build` - Build the project
- `dotnet restore` - Restore NuGet packages

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

- `POST /api/login` - Login endpoint
  - Request body: `{ "email": "user@example.com", "password": "password", "status": "Active" }`
  - Returns: User data on success

## Technology Stack

### Backend
- ASP.NET Core 9.0
- Microsoft.Data.SqlClient
- C#

### Frontend
- React 19
- Vite 7
- CSS3

---

**Note**: Make sure both backend and frontend are running simultaneously for the application to work properly!

# Erpreact
