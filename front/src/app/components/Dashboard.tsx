'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Gauge from './Gauge';
import axios from 'axios';

// Fonction utilitaire pour formater la distance en km
const formatDistance = (distanceMeters: number): string => {
  return (distanceMeters / 1000).toFixed(2);
};

const Dashboard: React.FC = () => {
  const { isConnected, carInfo, latestState, error } = useSelector((state: RootState) => state.simulation);
  const carId = 1;

  const speedMps = latestState?.speed ?? 0;
  const fuel = latestState?.fuel ?? 0;
  const distance = latestState?.distance ?? 0;
  const capacity = carInfo?.capacite_reservoir ?? 100; // Valeur par defaut pour eviter la division par zero

  // Conversion de la vitesse en km/h
  const speedKmh = speedMps * 3.6;

  // Conversion de la distance en kilometres
  const distanceKm = distance / 1000;

  // Calcul du carburant consomme
  const fuelConsumed = capacity - fuel;

  // Calcul de la consommation en L/100km
  const fuelConsumptionPer100Km = distanceKm > 0 ? (fuelConsumed / distanceKm) * 100 : 0; // eviter la division par zero

  const handleReplay = async () => {
    try {
      const URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await axios.post(`${URL}/replay/${carId}`);
      alert(response.data.message); // Afficher un message de succes
    } catch (error) {
      console.error('Erreur lors du replay :', error);
      alert('Erreur lors du replay des evenements.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4">
      <h2 className="text-3xl font-bold mb-4">{carInfo?.nom ?? 'Car Simulation'} Dashboard</h2>
      
      {/* Statut de connexion */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">Status: </span>
        <span className={`text-lg font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {error && <p className="text-red-500 text-sm">Error: {error}</p>}
      </div>

      {/* Affichage de la consommation */}
      <div className="bg-gray-800 p-4 mb-4 rounded-lg shadow-lg flex justify-between items-center w-full max-w-lg">
        <span className="font-bold">Consommation:</span>
        <span className="text-xl">{fuelConsumptionPer100Km.toFixed(2)} L/100km</span>
      </div>

      {/* Section des jauges */}
      <div className="flex flex-col md:flex-row items-center justify-around w-full gap-8 mb-8">
        {/* Jauge de vitesse */}
        <div className="flex flex-col items-center">
          <Gauge
            value={speedKmh}
            maxValue={280} // Maximum de la jauge (a adapter selon le vehicule)
            unit="km/h"
            label="Speedometer"
            minAngle={-135}
            maxAngle={135}
            gaugeSize={400}
          />
          <p className="mt-2 text-xl">Vitesse</p>
        </div>
      </div>

      {/* Autres lectures */}
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Jauge de carburant */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
          <span className="w-24 font-bold">Carburant:</span>
          <div className="flex-1 relative h-4 bg-gray-700 rounded overflow-hidden mx-4 border border-gray-600">
            <div
              className="absolute top-0 left-0 h-full bg-teal-400 transition-all duration-200"
              style={{ width: `${capacity > 0 ? (fuel / capacity) * 100 : 0}%` }}
            ></div>
            {/* Segments de separation */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full w-[2px] bg-gray-600"
                style={{ left: `${i * 10}%` }}
              ></div>
            ))}
          </div>
          <span className="min-w-[80px] text-right">{fuel.toFixed(1)} L</span>
        </div>

        {/* Affichage de la distance */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex justify-between items-center">
          <span className="font-bold">Distance:</span>
          <span className="text-xl">{formatDistance(distance)} km</span>
        </div>

        <button
          onClick={handleReplay}
          className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded"
        >
          Replay
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-800 rounded-lg shadow-lg w-full max-w-lg text-center text-sm">
        <p>
          Utilisez les commandes clavier pour accelerer ou freiner :<br />
          - <span className="text-teal-400">Barre d{"'"}espace + chiffres</span> pour regler l{"'"}acceleration<br />
          - <span className="text-teal-400">Touche B</span> pour le freinage
        </p>
      </div>
    </div>
  );
};

export default Dashboard;