import { io, Socket } from 'socket.io-client';
import { Car, SimulationState, UserInputState } from '../types';

interface ServerToClientEvents {
  simulationUpdate: (state: SimulationState) => void;
  initialState: (state: SimulationState, car: Car) => void;
  error: (message: string) => void;
}

interface ClientToServerEvents {
  requestInitialState: () => void;
  updateInput: (input: UserInputState) => void;
}

const URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
    autoConnect: false,
    reconnectionAttempts: 5, 
    reconnectionDelay: 1000,
});

// Gestionnaire global pour le developpement
socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message, err.cause);
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});