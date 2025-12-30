import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import timerReducer from './slices/timerSlice';
import uiReducer from './slices/uiSlice';

/**
 * Redux store configuration
 * Only stores client-side UI state, NOT server data (use React Query for that)
 */
export const store = configureStore({
  reducer: {
    timer: timerReducer,
    ui: uiReducer,
  },
  devTools: import.meta.env.DEV, // Enable Redux DevTools in development
});

// Infer types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Typed Redux hooks
 * Use these instead of plain useDispatch and useSelector
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
