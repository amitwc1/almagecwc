import axios from 'axios';

const API = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api/admin` });
const getAuthHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const adminService = {
  getStats: async (token) => {
    const res = await API.get('/stats', getAuthHeader(token));
    return res.data;
  },
  getUsers: async (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await API.get(`/users?${query}`, getAuthHeader(token));
    return res.data;
  },
  updateUserStatus: async (id, status, token) => {
    const res = await API.put(`/users/${id}/status`, { status }, getAuthHeader(token));
    return res.data;
  },
  updateUserRole: async (id, role, token) => {
    const res = await API.put(`/users/${id}/role`, { role }, getAuthHeader(token));
    return res.data;
  },
  deleteUser: async (id, token) => {
    const res = await API.delete(`/users/${id}`, getAuthHeader(token));
    return res.data;
  }
};

export default adminService;
