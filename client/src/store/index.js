import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import conversationReducer from './slices/conversationSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    conversation: conversationReducer,
  },
});
