import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import './App.css'

const theme = createTheme({
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          paddingTop: '12px !important',
          paddingBottom: '12px !important',
        },
      },
    },
  },
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!user);
    };

    checkLogin();
    window.addEventListener('storage', checkLogin);
    window.addEventListener('focus', checkLogin);

    // Periodically check in case of expiration
    const interval = setInterval(checkLogin, 2000);

    return () => {
      window.removeEventListener('storage', checkLogin);
      window.removeEventListener('focus', checkLogin);
      clearInterval(interval);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ErrorBoundary>
          <div className="App">
            {!isLoggedIn ? (
              <LoginForm />
            ) : (
              <Routes>
                <Route path="/*" element={<Dashboard />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
            <Footer />
          </div>
        </ErrorBoundary>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App
