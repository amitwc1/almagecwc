import { createContext, useContext, useState, useEffect } from 'react';
import authService, { extractErrorMessage } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Load user on mount or when token changes
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await authService.getMe(token);
          // Backend returns { success, id, name, email, role, badges, ... }
          // We need to set user as an object with at least { id, name, email, role }
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: userData.status,
            badges: userData.badges || [],
            unreadNotifications: userData.unreadNotifications || 0,
          });
          console.log('[AuthContext] User loaded:', userData.name, userData.role);
        } catch (err) {
          console.warn('[AuthContext] Failed to load user, clearing token:', extractErrorMessage(err));
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

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
