import axios from 'axios';

const API = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api/mentorship` });
const getAuthHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const mentorshipService = {
  request: async (mentorId, message, token) => {
    const res = await API.post('/request', { mentor_id: mentorId, message }, getAuthHeader(token));
    return res.data;
  },
  respond: async (requestId, status, token) => {
    const res = await API.put('/respond', { request_id: requestId, status }, getAuthHeader(token));
    return res.data;
  },
  getMyRequests: async (token) => {
    const res = await API.get('/my-requests', getAuthHeader(token));
    return res.data;
  }
};

export default mentorshipService;
