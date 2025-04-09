export interface Car {
    id: number;
    nom: string;
    capacite_acceleration: number; // m/s²
    capacite_deceleration: number; // m/s² (frein moteur/ralentissement naturel)
    capacite_freinage: number;     // m/s²
    capacite_frottement: number;   // m/s² (valeur fixe ajoutee a deceleration)
    capacite_reservoir: number;    // litres
    consommation: number;          // l/s a 100% acceleration
}

export interface Event {
    type: 'ACCEL_START' | 'ACCEL_STOP' | 'BRAKE_START' | 'BRAKE_STOP';
    value: number; // Niveau d'acceleration
    deltatime: number; // Duree de l'evenement en secondes
    timestamp: number; // Horodatage de l'evenement
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

// Pour les messages Socket.IO
export interface ServerToClientEvents {
    simulationUpdate: (state: SimulationState) => void;
    initialState: (state: SimulationState, car: Car) => void;
    error: (message: string) => void;
}

export interface ClientToServerEvents {
    requestInitialState: () => void;
    updateInput: (input: UserInputState) => void;
}