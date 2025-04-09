import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { SimulationEngine } from '../simulation/engine';
import { ClientToServerEvents, ServerToClientEvents, SimulationState, UserInputState } from '../types';

export class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private engine: SimulationEngine;

  constructor(httpServer: HttpServer, simulationEngine: SimulationEngine) {
    this.engine = simulationEngine;
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      cors: {
        origin: "*", // Configurez ceci de maniere plus restrictive en production !
        methods: ["GET", "POST"]
      }
    });
    this.initializeEvents();
    console.log("Socket.IO Service Initialized");
  }

  private initializeEvents(): void {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log(`Client connected: ${socket.id}`);

      // Envoyer l'etat initial a la connexion du client
      socket.on('requestInitialState', () => {
          try {
                const state = this.engine.getCurrentState();
                const car = this.engine.getCarData();
                console.log(`Sending initial state to ${socket.id}`);
                socket.emit('initialState', state, car);
          } catch (error) {
               console.error("Error sending initial state:", error);
               socket.emit('error', 'Failed to retrieve initial state.');
          }
      });


      // Gerer la mise a jour de l'input utilisateur
      socket.on('updateInput', (input: UserInputState) => {
        // console.log(`Received input from ${socket.id}:`, input); // Beaucoup de logs, decommenter si besoin
        this.engine.updateInput(input);
        // Optionnel: broadcast l'input reçu aux autres si necessaire
        // socket.broadcast.emit('userInputUpdate', { userId: socket.id, input });
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Methode pour broadcaster l'etat de la simulation a tous les clients
  broadcastState(state: SimulationState): void {
    this.io.emit('simulationUpdate', state);
    // console.log("Broadcasting state:", state); // Beaucoup de logs
  }

  getIO(): Server<ClientToServerEvents, ServerToClientEvents> {
      return this.io;
  }
}