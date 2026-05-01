import axios from 'axios';
import { API_URL } from './apiConfig';

const API = axios.create({ 
  baseURL: `${API_URL}/alumni`,
  withCredentials: true
});

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
