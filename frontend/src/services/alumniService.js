import axios from 'axios';

const API = axios.create({ baseURL: '/api/alumni' });

const alumniService = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await API.get(`/?${query}`);
    return res.data;
  },
  getById: async (id) => {
    const res = await API.get(`/${id}`);
    return res.data;
  },
  updateProfile: async (data, token) => {
    const res = await API.put('/update', data, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  }
};

export default alumniService;
