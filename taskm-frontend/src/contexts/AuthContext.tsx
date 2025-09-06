import React, { createContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Helper that races a promise with a timeout so network hangs don't block initialization
const withTimeout = <T,>(p: Promise<T>, ms = 5000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(timer); resolve(v); }).catch((e) => { clearTimeout(timer); reject(e); });
  });
};

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

export const AuthContext = createContext<{
  state: AuthState;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, username: string | undefined, email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
} | null>(null);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        initialized: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, token: null, error: null, initialized: true };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    initialized: false,
    error: null,
  });

  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    // Axios response interceptor to handle 401 and attempt token refresh
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshRes = await withTimeout(axios.post('/api/refresh', {}, { withCredentials: true, timeout: 5000 }), 3000); // refresh token is read from cookie by backend
            const newToken = refreshRes.data.token;
            localStorage.setItem('token', newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshErr) {
            // Try body refresh using stored refresh token (dev fallback)
            const storedRefresh = localStorage.getItem('refreshToken');
            if (storedRefresh) {
              try {
                const r2 = await withTimeout(axios.post('/api/refresh', { token: storedRefresh }, { withCredentials: true, timeout: 5000 }), 3000);
                const t2 = r2.data.token;
                if (t2) {
                  localStorage.setItem('token', t2);
                  axios.defaults.headers.common['Authorization'] = `Bearer ${t2}`;
                  originalRequest.headers['Authorization'] = `Bearer ${t2}`;
                  return axios(originalRequest);
                }
              } catch (e) {
                console.debug('Interceptor fallback refresh failed:', e);
              }
            }
            dispatch({ type: 'LOGOUT' });
            return Promise.reject(refreshErr);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [state.token]);

  // Try to restore session on mount using refresh token (HTTP-only cookie)
  useEffect(() => {
    let finished = false;
    const restoreSession = async () => {
      try {
        const res = await withTimeout(axios.post('/api/refresh', {}, { withCredentials: true, timeout: 5000 }), 3000);
        const { token, user } = res.data;
        if (token && user) {
          localStorage.setItem('token', token);
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
          // fetch notifications for user and show any unread
          const getMessage = (err: unknown): string => {
            if (err && typeof err === 'object' && 'message' in err) {
              const m = (err as Record<string, unknown>)['message'];
              if (typeof m === 'string') return m;
            }
            return String(err);
          };

          try {
            const notRes = await withTimeout(axios.get('/api/notifications', { withCredentials: true, timeout: 5000 }), 3000);
            const notifs = notRes.data || [];
            for (const n of notifs) {
              if (!n.read) {
                // simple popup notification
                try { window.alert(n.message); } catch { console.log('Notification:', n.message); }
                // mark read
                try { await axios.post(`/api/notifications/${n.id}/read`, {}, { withCredentials: true, timeout: 5000 }); } catch { console.debug('Failed to mark notification read'); }
              }
            }
          } catch (err: unknown) {
            console.debug('Could not fetch notifications:', getMessage(err));
          }
        }
      } catch (err: unknown) {
        // Try fallback: if we have a refreshToken stored in localStorage (dev), send it in body
        const storedRefresh = localStorage.getItem('refreshToken');
        if (storedRefresh) {
          try {
            const res2 = await withTimeout(axios.post('/api/refresh', { token: storedRefresh }, { withCredentials: true, timeout: 5000 }), 3000);
            const { token: t2, user: u2, refreshToken: newRefresh } = res2.data;
            if (t2 && u2) {
              localStorage.setItem('token', t2);
              if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
              dispatch({ type: 'AUTH_SUCCESS', payload: { user: u2, token: t2 } });
              finished = true;
              return;
            }
          } catch (e) {
            console.debug('Fallback refresh failed:', e);
          }
        }
        console.debug('No session restore:', err);
        dispatch({ type: 'LOGOUT' });
      }
      finished = true;
    };

    // safety timer: if restoreSession doesn't complete within X ms, force LOGOUT so UI progresses
    const safety = setTimeout(() => {
      if (!finished) {
        console.warn('Auth restore timed out, forcing logout to allow UI to render');
        dispatch({ type: 'LOGOUT' });
      }
    }, 4000);

    restoreSession().catch((e) => {
      // already handled inside restoreSession; guard to avoid unhandled rejections
      console.debug('restoreSession error (caught higher):', e);
    }).finally(() => clearTimeout(safety));

    return () => {
      clearTimeout(safety);
    };
    // run only once on mount
  }, []);

  const login = async (identifier: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await axios.post('/api/login', { identifier, password }, { withCredentials: true });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      // fetch notifications after login
      try {
        const notRes = await axios.get('/api/notifications', { withCredentials: true, timeout: 5000 });
        const notifs = notRes.data || [];
        for (const n of notifs) {
          if (!n.read) {
            try { window.alert(n.message); } catch { console.log('Notification:', n.message); }
            try { await axios.post(`/api/notifications/${n.id}/read`, {}, { withCredentials: true, timeout: 5000 }); } catch { console.debug('Failed to mark notification read'); }
          }
        }
      } catch (err: unknown) {
        const getMessage = (err: unknown): string => {
          if (err && typeof err === 'object' && 'message' in err) {
            const m = (err as Record<string, unknown>)['message'];
            if (typeof m === 'string') return m;
          }
          return String(err);
        };
        console.debug('Could not fetch notifications after login:', getMessage(err));
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        dispatch({ type: 'AUTH_ERROR', payload: error.response?.data?.message || 'Login failed' });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: 'Login failed' });
      }
    }
  };

  const register = async (name: string, username: string | undefined, email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      await axios.post('/api/register', { name, username, email, password }, { withCredentials: true });
      // Optionally, auto-login after registration
      const res = await axios.post('/api/login', { identifier: email, password }, { withCredentials: true });
      if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
      await login(email, password);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        dispatch({ type: 'AUTH_ERROR', payload: error.response?.data?.message || 'Registration failed' });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: 'Registration failed' });
      }
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
    } catch (err: unknown) {
      console.debug('Logout error ignored:', (err && typeof err === 'object' && 'message' in err) ? (err as Record<string, unknown>)['message'] : String(err));
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const resetPassword = async () => {
    dispatch({ type: 'AUTH_START' });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Just clear loading state for demo
      dispatch({ type: 'CLEAR_ERROR' });
    } catch {
      dispatch({ type: 'AUTH_ERROR', payload: 'Password reset failed' });
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

