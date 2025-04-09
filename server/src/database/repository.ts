import { pool } from '../config/db';
import { Car, Event } from '../types';

export const getCarById = async (id: number): Promise<Car | null> => {
  try {
    const result = await pool.query<Car>('SELECT * FROM voiture WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching car with id ${id}:`, error);
    return null;
  }
};

// Optionnel: Fonction pour logger les evenements
export const logSimulationEvent = async (carId: number, eventType: string, value?: number, timestamp?: Date) => {
  try {
    await pool.query(
      'INSERT INTO evenement (voiture_id, type_evenement, valeur, timestamp) VALUES ($1, $2, $3, $4)',
      [carId, eventType, value, timestamp || new Date()]
    );
  } catch (error) {
    console.error('Error logging event:', error);
  }
};

export async function getEventsForCar(carId: number): Promise<Event[]> {
  const query = `
    SELECT 
      type_evenement AS type, 
      valeur AS value, 
      timestamp,
      EXTRACT(EPOCH FROM (LEAD(timestamp) OVER (PARTITION BY voiture_id ORDER BY timestamp) - timestamp)) AS deltatime
    FROM evenement
    WHERE voiture_id = $1
    ORDER BY timestamp ASC
  `;
  const result = await pool.query<Event>(query, [carId]);
  const rows = result.rows;

  console.log('Fetched events for car:', carId, rows);

  return rows.map((row) => ({
    type: row.type,
    value: row.value,
    deltatime: row.deltatime ? parseFloat(row.deltatime.toString()) : 0,
    timestamp: row.timestamp,
  }));
}