import cron from 'node-cron';
import { SimulationEngine } from '../simulation/engine';
import { SocketService } from './SocketService';

const TICK_RATE_MS = parseInt(process.env.SIMULATION_TICK_RATE_MS || '100', 10);
const TICK_INTERVAL_SECONDS = TICK_RATE_MS / 1000.0;

export class SchedulerService {
  private engine: SimulationEngine;
  private socketService: SocketService;
  private task: cron.ScheduledTask | null = null;

  constructor(engine: SimulationEngine, socketService: SocketService) {
    this.engine = engine;
    this.socketService = socketService;
    console.log(`Scheduler Service Initialized with tick rate ${TICK_RATE_MS}ms`);
  }

  start(): void {
    if (this.task) {
      console.log("Scheduler already running.");
      return;
    }
    
    console.log(`Starting simulation loop with interval ${TICK_RATE_MS}ms.`);
    this.task = setInterval(() => {
      try {
        const newState = this.engine.tick(TICK_INTERVAL_SECONDS);
        this.socketService.broadcastState(newState);
      } catch (error) {
        console.error("Error during simulation tick:", error);
      }
    }, TICK_RATE_MS) as any; // Cast pour type NodeJS.Timeout

    console.log("Simulation Scheduler Started.");
  }

  stop(): void {
    if (this.task) {
      clearInterval(this.task as any); // Cast
      this.task = null;
      console.log("Simulation Scheduler Stopped.");
    }
  }
}