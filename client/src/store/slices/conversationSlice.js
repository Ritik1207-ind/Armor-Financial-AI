import { createSlice } from '@reduxjs/toolkit';

const conversationSlice = createSlice({
  name: 'conversation',
  initialState: {
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addConversation: (state, action) => {
      state.history.unshift(action.payload);
    },
    setHistory: (state, action) => {
      state.history = action.payload;
    }
  }
});

export const { setLoading, setError, addConversation, setHistory } = conversationSlice.actions;
export default conversationSlice.reducer;
