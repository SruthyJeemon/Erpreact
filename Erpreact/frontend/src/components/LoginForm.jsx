import { useState } from 'react';
import './LoginForm.css';
import LoadingSpinner from './LoadingSpinner';
import logo from '../assets/asas_logo.png';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    status: 'Active',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use HTTP endpoint for development (change to HTTPS endpoint if needed)
      // Use relative path for proxying in dev, or the env variable if defined
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setUser(data.user);
        // Store user data in localStorage or context for future use
        localStorage.setItem('user', JSON.stringify(data.user));
        // Trigger page reload to show AdminSettings
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please check if the backend server is running.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Side - Globe Visualization */}
      <div className="login-left">
        <div className="globe-visualization">
          <svg viewBox="0 0 600 600" className="globe-svg">
            {/* Abstract network/globe design */}
            <circle cx="300" cy="300" r="200" fill="none" stroke="#4a90e2" strokeWidth="2" opacity="0.3" />
            <circle cx="300" cy="300" r="150" fill="none" stroke="#4a90e2" strokeWidth="2" opacity="0.3" />
            <circle cx="300" cy="300" r="100" fill="none" stroke="#4a90e2" strokeWidth="2" opacity="0.3" />
            {/* Network nodes */}
            {Array.from({ length: 20 }, (_, i) => {
              const angle = (i * 360) / 20;
              const radius = 150;
              const x = 300 + radius * Math.cos((angle * Math.PI) / 180);
              const y = 300 + radius * Math.sin((angle * Math.PI) / 180);
              return (
                <circle key={i} cx={x} cy={y} r="8" fill="#4a90e2" opacity="0.6">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
                </circle>
              );
            })}
            {/* Connection lines */}
            {Array.from({ length: 30 }, (_, i) => {
              const startAngle = (i * 360) / 30;
              const endAngle = ((i + 5) * 360) / 30;
              const radius = 150;
              const x1 = 300 + radius * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 300 + radius * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 300 + radius * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 300 + radius * Math.sin((endAngle * Math.PI) / 180);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a90e2" strokeWidth="1" opacity="0.2" />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-card">
          {/* ASAS Logo */}
          <div className="login-logo-container" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img src={logo} alt="ASAS Logo" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
          </div>

          {/* Login Title */}
          <h1 className="login-title">Login</h1>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Username/Email Field */}
            <div className="form-group">
              <label htmlFor="email">Username or email address</label>
              <div className="input-wrapper">
                {/*<svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>*/}
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email or username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                {/*} <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>*/}
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                  disabled={loading}
                />
                <span>Remember Me</span>
              </label>
              <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>
                Forgot Password?
              </a>
            </div>

            {/* Sign Button */}
            <button
              type="submit"
              className="sign-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign'}
            </button>
          </form>

          {/* Separator */}

          {/* Social Login Icons */}




        </div>
      </div>

      {/* Footer - Full Width */}
      <footer className="login-footer">
        Copyright© 2026 All Rights Reserved By ASAS
      </footer>
    </div>
  );
};

export default LoginForm;
