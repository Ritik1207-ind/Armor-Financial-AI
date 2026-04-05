import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import conversationReducer from './slices/conversationSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    conversation: conversationReducer,
    auth: authReducer,
  },
});
