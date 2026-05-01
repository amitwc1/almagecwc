const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://almagecwc-backend.vercel.app';

export const API_URL = `${API_BASE_URL}/api`;
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

export default API_BASE_URL;
