/**
 * Logout utility function
 * Clears all session data and redirects to login page
 */
export const handleLogout = async () => {
  try {
    // Call backend logout endpoint (optional, for server-side session cleanup)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50094';
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      // Continue with logout even if backend call fails
      console.warn('Backend logout call failed, continuing with local logout:', error);
    }

    // Clear all localStorage items
    localStorage.clear();

    // Clear all sessionStorage items
    sessionStorage.clear();

    // Clear any cookies (if used)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Redirect to login page
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if there's an error
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }
};
