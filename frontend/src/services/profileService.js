import axios from 'axios';

const API = axios.create({
  baseURL: '/api/profile',
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

const profileService = {
  // Get current user profile
  getMe: async () => {
    const res = await API.get('/me');
    return res.data;
  },

  // Get public profile by userId
  getPublicProfile: async (userId) => {
    const res = await API.get(`/${userId}`);
    return res.data;
  },

  // Update basic info (supports FormData for image)
  updateProfile: async (formData) => {
    const res = await API.put('/update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Education
  addEducation: async (data) => {
    const res = await API.post('/education', data);
    return res.data;
  },
  updateEducation: async (id, data) => {
    const res = await API.put(`/education/${id}`, data);
    return res.data;
  },
  deleteEducation: async (id) => {
    const res = await API.delete(`/education/${id}`);
    return res.data;
  },

  // Experience
  addExperience: async (data) => {
    const res = await API.post('/experience', data);
    return res.data;
  },
  updateExperience: async (id, data) => {
    const res = await API.put(`/experience/${id}`, data);
    return res.data;
  },
  deleteExperience: async (id) => {
    const res = await API.delete(`/experience/${id}`);
    return res.data;
  },

  // Skills
  addSkill: async (skillName) => {
    const res = await API.post('/skills', { skill_name: skillName });
    return res.data;
  },
  deleteSkill: async (id) => {
    const res = await API.delete(`/skills/${id}`);
    return res.data;
  }
};

export default profileService;
