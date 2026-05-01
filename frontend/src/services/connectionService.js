import axios from 'axios';
import { API_URL } from './apiConfig';

const API = axios.create({ 
  baseURL: `${API_URL}/connections`,
  withCredentials: true 
});
const getAuthHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const connectionService = {
  send: async (receiverId, token) => {
    const res = await API.post('/send', { receiver_id: receiverId }, getAuthHeader(token));
    return res.data;
  },
  respond: async (connectionId, status, token) => {
    const res = await API.put('/respond', { connection_id: connectionId, status }, getAuthHeader(token));
    return res.data;
  },
  getAll: async (token, status) => {
    const query = status ? `?status=${status}` : '';
    const res = await API.get(`/list${query}`, getAuthHeader(token));
    return res.data;
  },
  getStatus: async (userId, token) => {
    const res = await API.get(`/status/${userId}`, getAuthHeader(token));
    return res.data;
  },
  getRequests: async (token) => {
    const res = await API.get('/requests', getAuthHeader(token));
    return res.data;
  },
  getPendingCount: async (token) => {
    const res = await API.get('/count/pending', getAuthHeader(token));
    return res.data;
  },
  remove: async (connectionId, token) => {
    const res = await API.delete(`/${connectionId}`, getAuthHeader(token));
    return res.data;
  }
};

export default connectionService;
