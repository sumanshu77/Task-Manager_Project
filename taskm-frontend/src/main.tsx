import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';
import './index.css';

// Determine API base URL from env. Vite prefers VITE_*, but support REACT_APP_API_URL for compatibility.
const env = import.meta.env as Record<string, unknown>;
// Default to the deployed backend when no env var is provided
const DEFAULT_API_URL = 'https://task-manager-backend-8.onrender.com';
// process.env is not available in the browser; avoid referencing it directly to satisfy TS.
const API_URL = (env.VITE_API_URL as string) || (env.REACT_APP_API_URL as string) || DEFAULT_API_URL;
if (API_URL) {
  axios.defaults.baseURL = API_URL;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
