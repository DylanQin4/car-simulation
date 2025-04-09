import { Car, SimulationState, UserInputState } from '../types';
import { getEventsForCar, logSimulationEvent } from '../database/repository';

const MIN_CONSUMPTION_IDLE_FACTOR = 0.0; // 5% de la conso max pour le ralenti/roue libre
const MIN_SPEED_FOR_IDLE_CONSUMPTION = 0.0; // Vitesse minimale pour consommer du carburant au ralenti (m/s)

export class SimulationEngine {
  private state!: SimulationState;
  private car: Car;
  private currentInput: UserInputState = { accelerationLevel: 0, isBraking: false };
  private lastInputLog: UserInputState = { accelerationLevel: 0, isBraking: false }; // Pour loguer seulement les changements

  constructor(carData: Car, initialFuel?: number) {
    this.car = carData;

    // Charger l'etat initial a partir des evenements
    this.calculateInitialState(carData.id, carData).then(initialState => {
      this.state = initialState;
      console.log("Simulation Engine Initialized for Car:", this.car.id);
      console.log("Initial State:", this.state);
    }).catch(error => {
      console.error("Failed to load initial state:", error);
      // Si une erreur survient, utiliser un etat par defaut
      this.state = {
        carId: carData.id,
        speed: 0,
        fuel: initialFuel ?? carData.capacite_reservoir,
        distance: 0,
        timestamp: Date.now(),
      };
    });
  }

  updateInput(newInput: UserInputState) {
    // Log uniquement les changements d'etat d'acceleration : passage de 0 a >0 (ACCEL_START) et de >0 a 0 (ACCEL_STOP)
    if (newInput.accelerationLevel !== this.lastInputLog.accelerationLevel) {
      if (newInput.accelerationLevel > 0 && this.lastInputLog.accelerationLevel === 0) {
        logSimulationEvent(this.car.id, 'ACCEL_START', newInput.accelerationLevel);
      } else if (newInput.accelerationLevel === 0 && this.lastInputLog.accelerationLevel > 0) {
        logSimulationEvent(this.car.id, 'ACCEL_STOP');
      }
      this.lastInputLog.accelerationLevel = newInput.accelerationLevel;
    }
    
    // Log uniquement pour le freinage : changement d'etat
    if (newInput.isBraking !== this.lastInputLog.isBraking) {
      logSimulationEvent(this.car.id, newInput.isBraking ? 'BRAKE_START' : 'BRAKE_STOP');
      this.lastInputLog.isBraking = newInput.isBraking;
    }
    
    this.currentInput = newInput;
  }
  
  tick(deltatime: number): SimulationState {
    const previousSpeed = this.state.speed;
  
    // 1. Calcul de l'acceleration nette (en m/s²)
    let netAcceleration = 0;
    const canAccelerate = this.state.fuel > 0;
  
    if (this.currentInput.isBraking) {
      netAcceleration = -this.car.capacite_freinage;
    } else if (this.currentInput.accelerationLevel > 0 && canAccelerate) {
      netAcceleration = this.currentInput.accelerationLevel * this.car.capacite_acceleration;
      // On applique la deceleration naturelle et le frottement meme en accelerant
      netAcceleration -= (this.car.capacite_deceleration + this.car.capacite_frottement);
    } else {
      // En mode coast : deceleration naturelle + frottement
      netAcceleration = -(this.car.capacite_deceleration + this.car.capacite_frottement);
    }
  
    // 2. Mise a jour de la vitesse
    this.state.speed += netAcceleration * deltatime;
    if (this.state.speed < 0) {
      // On empeche une vitesse negative
      this.state.speed = 0;
      netAcceleration = 0;
    }
  
    // 3. Mise a jour de la distance (approximation par la vitesse moyenne)
    const averageSpeed = (previousSpeed + this.state.speed) / 2;
    this.state.distance += averageSpeed * deltatime;
  
    // 4. Mise a jour du carburant
    let fuelConsumed = 0;
    if (this.state.speed > 0 || netAcceleration > 0) { // Consommation uniquement si le vehicule bouge ou essaie de bouger
      if (this.currentInput.accelerationLevel > 0 && canAccelerate && !this.currentInput.isBraking) {
        // Consommation proportionnelle au niveau d'acceleration
        fuelConsumed = this.currentInput.accelerationLevel * this.car.consommation * deltatime;
      } else if (this.state.speed >= MIN_SPEED_FOR_IDLE_CONSUMPTION && !this.currentInput.isBraking) {
        // Consommation minimale au ralenti
        fuelConsumed = MIN_CONSUMPTION_IDLE_FACTOR * this.car.consommation * deltatime;
      }
    }
  
    this.state.fuel -= fuelConsumed;
    if (this.state.fuel < 0) {
      this.state.fuel = 0;
      if (canAccelerate) {
        console.warn(`Car ${this.car.id} ran out of fuel!`);
      }
    }
  
    // 5. Mise a jour du timestamp
    this.state.timestamp = Date.now();
  
    return this.getCurrentState();
  }
  

  async calculateInitialState(carId: number, car: Car): Promise<SimulationState> {
    const events = await getEventsForCar(carId);
    console.log("Fetched events for car:", carId, "Events:", events);
  
    let speed = 0;
    let fuel = car.capacite_reservoir;
    let distance = 0;
    
    // Variables d'etat pour savoir si on est en acceleration ou freinage
    let isAccelerating = false;
    let accelLevel = 0;
    let isBraking = false;
  
    events.forEach(event => {
      // Utilise event.deltatime s'il est positif, sinon 1 seconde (pour eviter zero)
      const dt = (typeof event.deltatime === 'number' && event.deltatime > 0) ? event.deltatime : 1;
      console.log('Processing event:', event, 'dt:', dt);
      
      // Sauvegarde la vitesse precedente pour le calcul de la distance
      const previousSpeed = speed;
      
      switch (event.type) {
        case 'ACCEL_START':
          isAccelerating = true;
          accelLevel = event.value; // Niveau d'acceleration (entre 0 et 1)
          // Calcul de l'acceleration effective et mise a jour de la vitesse
          speed += accelLevel * car.capacite_acceleration * dt;
          // Consommation de carburant proportionnelle au niveau d'acceleration
          fuel -= accelLevel * car.consommation * dt;
          break;
          
        case 'ACCEL_STOP':
          isAccelerating = false;
          accelLevel = 0;
          break;
          
        case 'BRAKE_START':
          isBraking = true;
          // Application du freinage sur la vitesse
          speed -= car.capacite_freinage * dt;
          break;
          
        case 'BRAKE_STOP':
          isBraking = false;
          break;
      }
      
      // Empecher que la vitesse ne devienne negative
      if (speed < 0) {
        speed = 0;
      }
      
      // Calcul de la distance parcourue sur cet intervalle : vitesse moyenne * dt
      const avgSpeed = (previousSpeed + speed) / 2;
      distance += avgSpeed * dt;
      
      console.log(`After event ${event.type}: speed=${speed.toFixed(2)} m/s, fuel=${fuel.toFixed(3)} L, distance=${distance.toFixed(2)} m`);
    });
    
    // Correction des valeurs negatives eventuelles
    if (fuel < 0) fuel = 0;
    
    return {
      carId,
      speed,
      fuel,
      distance,
      timestamp: Date.now(),
    };
  }
  


  getCurrentState(): SimulationState {
    // Return a copy to prevent external modification
    return { ...this.state };
  }

  getCarData(): Car {
      return { ...this.car };
  }
}