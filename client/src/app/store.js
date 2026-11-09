import { configureStore } from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice.js';

export const createStore = (preloadedState) => configureStore({ reducer: { auth }, preloadedState });
export const store = createStore();
