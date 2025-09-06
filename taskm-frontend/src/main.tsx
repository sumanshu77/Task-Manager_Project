import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';
import './index.css';

// ✅ Read env vars
const env = import.meta.env;

const DEFAULT_API_URL = ' http://localhost:5000'; // ✅ local backend (not 5173, which is frontend)
const rawUrl =
  env.VITE_API_URL || env.REACT_APP_API_URL || DEFAULT_API_URL;

// ✅ Sanitize the URL
const API_URL = rawUrl.replace(/;+/g, '').trim().replace(/\/+$/g, '');
axios.defaults.baseURL = API_URL;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
