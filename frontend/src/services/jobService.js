import axios from 'axios';

const API = axios.create({ baseURL: '/api/jobs' });
const getAuthHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const jobService = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await API.get(`/?${query}`);
    return res.data;
  },
  create: async (data, token) => {
    const res = await API.post('/', data, getAuthHeader(token));
    return res.data;
  },
  apply: async (id, data, token) => {
    const res = await API.post(`/${id}/apply`, data, getAuthHeader(token));
    return res.data;
  },
  getApplications: async (id, token) => {
    const res = await API.get(`/${id}/applications`, getAuthHeader(token));
    return res.data;
  },
  delete: async (id, token) => {
    const res = await API.delete(`/${id}`, getAuthHeader(token));
    return res.data;
  }
};

export default jobService;
