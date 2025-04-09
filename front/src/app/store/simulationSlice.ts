import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SimulationState, Car, SimulationSliceState } from '../types';


const initialState: SimulationSliceState = {
    isConnected: false,
    carInfo: null,
    latestState: null,
    error: null,
};

export const simulationSlice = createSlice({
    name: 'simulation',
    initialState,
    reducers: {
        setConnected: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
            if (!action.payload) {
                // Reinitialiser l'etat si deconnecte ? Optionnel
                // state.latestState = null;
                // state.carInfo = null;
            }
            state.error = null;
        },
        setInitialData: (state, action: PayloadAction<{ state: SimulationState, car: Car }>) => {
            state.latestState = action.payload.state;
            state.carInfo = action.payload.car;
            state.error = null;
        },
        updateSimulationState: (state, action: PayloadAction<SimulationState>) => {
            state.latestState = action.payload;
            state.error = null;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        },
         resetState: (state) => {
            state.isConnected = false;
            state.carInfo = null;
            state.latestState = null;
            state.error = null;
        }
    },
});

export const {
    setConnected,
    setInitialData,
    updateSimulationState,
    setError,
    resetState
} = simulationSlice.actions;

export default simulationSlice.reducer;