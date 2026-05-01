import axios from 'axios';

/**
 * Auth API Service
 *
 * Uses Vite's dev proxy (/api → http://localhost:5000) so no absolute URL needed.
 * Axios instance ensures consistent headers across all auth requests.
 *
 * Backend error responses follow this shape:
 *   { success: false, error: "...", details?: [...] }
 * Validation errors include a `details` array of { field, message } objects.
 */
const API = axios.create({
  baseURL: '/api/auth',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 second timeout for slow connections
});

/**
 * Extracts a user-readable error message from an Axios error.
 * Handles: backend error responses, validation errors, network failures, timeouts.
 */
export const extractErrorMessage = (err) => {
  // Network error — server not reachable
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Server not reachable. Please check if the backend is running.';
  }

  // Timeout
  if (err.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  const data = err.response?.data;

  // Validation errors (422) — backend returns { error, details: [{ field, message }] }
  if (data?.details && Array.isArray(data.details)) {
    // Return the first validation error's message for inline display
    return data.details.map((d) => d.message).join('. ');
  }

  // Standard backend error — field is `error`, NOT `message`
  if (data?.error) return data.error;

  // Fallback for non-standard responses (e.g., auth middleware uses `message`)
  if (data?.message) return data.message;

  // HTTP status-based fallback
  const status = err.response?.status;
  if (status === 401) return 'Invalid email or password.';
  if (status === 403) return 'Access denied.';
  if (status === 409) return 'An account with this email already exists.';
  if (status === 422) return 'Please check your input and try again.';
  if (status === 429) return 'Too many attempts. Please wait and try again.';
  if (status >= 500) return 'Server error. Please try again later.';

  return 'Something went wrong. Please try again.';
};

const authService = {
  /**
   * POST /api/auth/register
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @param {string} role - 'student' | 'alumni'
   * @returns {{ success, token, user }}
   */
  register: async (name, email, password, role) => {
    console.log('[AuthService] Register request:', { name, email, role });
    const res = await API.post('/register', { name, email, password, role });
    console.log('[AuthService] Register response:', res.data);
    return res.data;
  },

  /**
   * POST /api/auth/login
   * @param {string} email
   * @param {string} password
   * @returns {{ success, token, user }}
   */
  login: async (email, password) => {
    console.log('[AuthService] Login request:', { email });
    const res = await API.post('/login', { email, password });
    console.log('[AuthService] Login response:', res.data);
    return res.data;
  },

  /**
   * GET /api/auth/me
   * @param {string} token - JWT bearer token
   * @returns {{ success, id, name, email, role, badges, unreadNotifications }}
   */
  getMe: async (token) => {
    console.log('[AuthService] Fetching current user...');
    const res = await API.get('/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('[AuthService] Current user:', res.data);
    return res.data;
  },
};

export default authService;
