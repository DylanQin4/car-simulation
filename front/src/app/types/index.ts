export interface Car {
    id: number;
    nom: string; // Ajoute pour affichage
    capacite_acceleration: number;
    capacite_deceleration: number;
    capacite_freinage: number;
    capacite_frottement: number;
    capacite_reservoir: number;
    consommation: number;
}

export interface SimulationState {
    speed: number;      // m/s
    fuel: number;       // litres
    distance: number;   // metres
    carId: number;
    timestamp: number;
}

export interface UserInputState {
    accelerationLevel: number; // 0.0 to 1.0
    isBraking: boolean;
}

// Types pour Redux store
export interface AppState {
    simulation: SimulationSliceState;
}

export interface SimulationSliceState {
    isConnected: boolean;
    carInfo: Car | null;
    latestState: SimulationState | null;
    error: string | null;
}