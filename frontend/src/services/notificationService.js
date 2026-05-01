import axios from 'axios';
import { API_URL } from './apiConfig';

const API = axios.create({
  baseURL: `${API_URL}/notifications`,
  withCredentials: true,
});

// Add a request interceptor to attach the JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const notificationService = {
  getAll: async () => {
    const response = await API.get('/');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await API.put(`/read/${id}`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await API.put('/read-all');
    return response.data;
  }
};

export default notificationService;
