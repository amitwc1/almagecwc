import axios from 'axios';

const API = axios.create({ baseURL: '/api/events' });
const getAuthHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const eventService = {
  getAll: async () => { const res = await API.get('/'); return res.data; },
  create: async (data, token) => {
    const res = await API.post('/', data, getAuthHeader(token));
    return res.data;
  },
  delete: async (id, token) => {
    const res = await API.delete(`/${id}`, getAuthHeader(token));
    return res.data;
  },
  register: async (id, token) => {
    const res = await API.post(`/${id}/register`, {}, getAuthHeader(token));
    return res.data;
  },
  unregister: async (id, token) => {
    const res = await API.delete(`/${id}/register`, getAuthHeader(token));
    return res.data;
  },
  getAttendees: async (id, token) => {
    const res = await API.get(`/${id}/attendees`, getAuthHeader(token));
    return res.data;
  }
};

export default eventService;
