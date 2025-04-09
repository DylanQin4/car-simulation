import { configureStore } from '@reduxjs/toolkit';
import simulationReducer from './simulationSlice';

export const store = configureStore({
    reducer: {
        simulation: simulationReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;