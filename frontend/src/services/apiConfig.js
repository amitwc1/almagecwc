const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

const API_BASE_URL = isProduction 
  ? 'https://almagecwc-backend.vercel.app' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

export const API_URL = `${API_BASE_URL}/api`;
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

export default API_BASE_URL;
