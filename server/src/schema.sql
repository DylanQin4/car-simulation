-- Active: 1736442537724@@127.0.0.1@5432@simulation_auto
-- Table Voiture
CREATE TABLE voiture (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL DEFAULT 'Default Car',
    -- ATTENTION: Stocker en m/s^2 pour simplification interne ou convertir au chargement
    -- Exemple: Si km/s^2 en BDD, multiplier par 1000 dans le repository
    capacite_acceleration REAL NOT NULL, -- en m/s^2
    capacite_deceleration REAL NOT NULL, -- en m/s^2 (deceleration naturelle sans frein/accel)
    capacite_freinage REAL NOT NULL,     -- en m/s^2
    capacite_frottement REAL NOT NULL,   -- en m/s^2 (ajoute a la deceleration)
    capacite_reservoir REAL NOT NULL,    -- en litres
    consommation REAL NOT NULL           -- en l/s a 100% d'accel
);

-- Table Evenements (Optionnel, pour historique)
CREATE TABLE evenement (
    id SERIAL PRIMARY KEY,
    voiture_id INTEGER REFERENCES voiture(id),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    type_evenement VARCHAR(50), -- 'ACCEL_START', 'ACCEL_STOP', 'BRAKE_START', 'BRAKE_STOP'
    valeur REAL NULL -- Par exemple, le niveau d'acceleration
);

-- Insertion d'une voiture exemple (Adapter les valeurs !)
-- Supposons que les valeurs sont deja en m/s^2 ici pour l'exemple
INSERT INTO voiture (
    id, nom, capacite_acceleration, capacite_deceleration, capacite_freinage, capacite_frottement, capacite_reservoir, consommation
) VALUES (
    1, 'SimCar Mark I', 20.0, 0, 15.0, 0.0, 100.0, 0.02
);
-- Note: 3.0 m/s^2 = 10.8 km/h/s. 0.02 l/s = 72 l/h a fond ! Ajustez ces valeurs.


-- Creer une vue pour calculer les durees entre les evenements
CREATE VIEW evenement_with_durations AS
SELECT
    e.id,
    e.voiture_id,
    e.timestamp,
    e.type_evenement,
    e.valeur,
    LEAD(e.timestamp) OVER (PARTITION BY e.voiture_id ORDER BY e.timestamp) - e.timestamp AS duration -- Duree entre deux evenements
FROM
    evenement e;

SELECT 
  type_evenement AS type, 
  valeur AS value, 
  timestamp,
  LEAD(timestamp) OVER (PARTITION BY voiture_id ORDER BY timestamp) AS next_timestamp,
  LEAD(timestamp) OVER (PARTITION BY voiture_id ORDER BY timestamp) - timestamp AS deltatime
FROM evenement
WHERE voiture_id = 1
ORDER BY timestamp ASC;

SELECT * FROM evenement WHERE voiture_id = 1 ORDER BY timestamp ASC;


-- (Optionnel) Nettoyer les evenements existants pour la voiture 1
DELETE FROM evenement WHERE voiture_id = 1;


