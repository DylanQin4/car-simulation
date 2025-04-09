import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db'; // Initialise la connexion BDD
import { getCarById, getEventsForCar, logSimulationEvent } from './database/repository';
import { SimulationEngine } from './simulation/engine';
import { SocketService } from './service/SocketService';
import { SchedulerService } from './service/SchedulerService';

dotenv.config();

const PORT = process.env.PORT || 4000;
const CAR_ID = parseInt(process.env.SIMULATION_CAR_ID || '1', 10);

async function startServer() {
  // 1. Charger les donnees de la voiture
  const car = await getCarById(CAR_ID);
  if (!car) {
    console.error(`FATAL: Car with ID ${CAR_ID} not found in database.`);
    process.exit(1);
  }
  console.log(`Loaded data for car ID ${car.id}: ${car.nom}`);

  // 2. Initialiser le moteur de simulation
  const simulationEngine = new SimulationEngine(car);

  // 3. Creer le serveur Express et HTTP
  const app = express();
  app.use(cors());
  app.use(express.json());
  const httpServer = http.createServer(app);

  // Endpoint de test
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  app.get('/api/car-info', (req, res) => {
    try {
      const carData = simulationEngine.getCarData();
      res.status(200).json(carData);
    } catch (error) {
      res.status(500).send("Error fetching car data");
    }
  });

  // 4. Initialiser le service Socket.IO
  const socketService = new SocketService(httpServer, simulationEngine);

  // 5. Initialiser et demarrer le Scheduler
  const schedulerService = new SchedulerService(simulationEngine, socketService);
  schedulerService.start(); // Demarre la boucle de simulation

  // 6. Demarrer le serveur HTTP
  httpServer.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
    console.log(`Simulating car ID: ${CAR_ID}`);
  });

  // Gestion de l'arret propre
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    schedulerService.stop();
    httpServer.close(() => {
      console.log('HTTP server closed');
      pool.end(() => {
         console.log('Database pool closed');
         process.exit(0);
      });
    });
  });
  process.on('SIGINT', () => { // Pour Ctrl+C
    console.log('SIGINT signal received: closing HTTP server');
    schedulerService.stop();
    httpServer.close(() => {
      console.log('HTTP server closed');
      pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
      });
    });
  });

  // Route pour rejouer les evenements
  app.post('/replay/:carId', async (req, res) => {
    const carId = parseInt(req.params.carId, 10);
    const now = new Date(); // Date actuelle au moment du clic sur "Replay"
  
    try {
      // Recuperer les evenements pour la voiture donnee
      const events = await getEventsForCar(carId);
  
      if (!events || events.length === 0) {
        return res.status(404).json({ message: 'Aucun evenement trouve pour cette voiture.' });
      }
  
      // Calculer le decalage entre le premier evenement et "now"
      const firstEventTimestamp = new Date(events[0].timestamp).getTime();
      const offset = now.getTime() - firstEventTimestamp;
  
      // Rejouer les evenements avec des horodatages recalcules
      for (const event of events) {
        // Recalculer le nouveau timestamp en appliquant l'offset
        const originalTimestamp = new Date(event.timestamp).getTime();
        const newTimestamp = new Date(originalTimestamp + offset);
  
        // Inserer l'evenement avec le nouveau timestamp
        await logSimulationEvent(carId, event.type, event.value, newTimestamp);
      }
  
      res.status(200).json({ message: 'Replay effectue avec succes.' });
    } catch (error) {
      console.error('Erreur lors du replay des evenements :', error);
      res.status(500).json({ message: 'Erreur lors du replay des evenements.' });
    }
  });

}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});