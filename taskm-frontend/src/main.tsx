import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';
import './index.css';

// ✅ Read env vars from Vite and sanitize
const env = import.meta.env as Record<string, string | undefined>;

const DEFAULT_API_URL = 'https://taskm-backend.onrender.com';
const rawUrl =
  env.VITE_API_URL ||
  env.REACT_APP_API_URL ||  // fallback if user used CRA-style vars
  DEFAULT_API_URL;

// ✅ Sanitize URL: remove trailing semicolons or slashes
const API_URL = rawUrl.replace(/;+/g, '').trim().replace(/\/+$/g, '');
axios.defaults.baseURL = API_URL;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
