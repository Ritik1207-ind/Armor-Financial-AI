import { createSlice } from '@reduxjs/toolkit';

const appSlice = createSlice({
  name: 'app',
  initialState: {
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    }
  }
});

export const { toggleTheme, setTheme } = appSlice.actions;
export default appSlice.reducer;
