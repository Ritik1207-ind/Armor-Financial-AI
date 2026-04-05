import { createSlice } from '@reduxjs/toolkit';

const getSafeLocalStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined') return fallback;
    return JSON.parse(item);
  } catch (err) {
    return fallback;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getSafeLocalStorage('user', null),
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { setLoading, setAuth, setError, logout } = authSlice.actions;
export default authSlice.reducer;
