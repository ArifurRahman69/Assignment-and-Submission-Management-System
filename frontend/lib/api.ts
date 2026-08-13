import axios from 'axios';

const API_BASE_URL = 'https://localhost:7236/api'; // আপনার backend API URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: প্রতিটা রিকোয়েস্টে লোকাল স্টোরেজে থাকা JWT Token অটোমেটিক যোগ করে দেবে
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;