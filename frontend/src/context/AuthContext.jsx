import { createContext, useContext, useState, useEffect } from 'react';
import authService, { extractErrorMessage } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const [isInitialized, setIsInitialized] = useState(false);

  // Load user on mount or when token changes
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        const userData = await authService.getMe(token);
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          badges: userData.badges || [],
          unreadNotifications: userData.unreadNotifications || 0,
        });
      } catch (err) {
        console.warn('[AuthContext] Failed to load user, clearing token');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    if (!isInitialized || token) {
      loadUser();
    }
  }, [token, isInitialized]);

  /**
   * Login — calls backend, stores token, sets user state.
   * Throws the original axios error so the calling component can display it.
   */
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    console.log('[AuthContext] Login successful, storing token');
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Register — calls backend, stores token, sets user state.
   * Throws the original axios error so the calling component can display it.
   */
  const register = async (name, email, password, role) => {
    const data = await authService.register(name, email, password, role);
    console.log('[AuthContext] Registration successful, storing token');
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  /**
   * Logout — clears all auth state and localStorage.
   */
  const logout = () => {
    console.log('[AuthContext] Logging out');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
