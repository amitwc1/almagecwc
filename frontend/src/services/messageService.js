import axios from 'axios';

const API = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api/messages` });
const getAuthHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const messageService = {
  getConversations: async (token) => {
    const res = await API.get('/conversations', getAuthHeader(token));
    return res.data;
  },
  getContacts: async (token) => {
    const res = await API.get('/contacts', getAuthHeader(token));
    return res.data;
  },
  getMessages: async (userId, token) => {
    const res = await API.get(`/${userId}`, getAuthHeader(token));
    return res.data;
  },
  send: async (receiverId, content, token) => {
    let payload;
    if (content instanceof FormData) {
      payload = content;
      if (!payload.has('receiver_id')) {
        payload.append('receiver_id', receiverId);
      }
    } else {
      payload = { receiver_id: receiverId, content };
    }
    const res = await API.post('/send', payload, getAuthHeader(token));
    return res.data;
  },
  markAsRead: async (senderId, token) => {
    const res = await API.put('/read', { sender_id: senderId }, getAuthHeader(token));
    return res.data;
  }
};

export default messageService;
