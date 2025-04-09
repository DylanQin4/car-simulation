# Simulation Automobile

C'est une application de simulation automobile en temps réel. Elle permet de visualiser et d'interagir avec une voiture simulée via un tableau de bord, tout en enregistrant les événements dans une base de données.

## Aperçu de l'application

![Tableau de Bord](./screenshot.png)

## Fonctionnalités

* Affichage en temps réel de la vitesse, du carburant restant et de la distance parcourue.
* Commandes clavier pour accélérer ou freiner la voiture.
* Fonctionnalité de "Replay" pour rejouer les événements enregistrés.
* Calcul de la consommation de carburant en L/100km.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants :

* [Node.js](https://nodejs.org/) (version 16 ou supérieure)
* `npm` ou `yarn`
* [PostgreSQL](https://www.postgresql.org/) (version 12 ou supérieure)

## Installation

1.  **Clonez le dépôt :**
    ```bash
    git clone [https://github.com/DylanQin4/car-simulation.git](https://github.com/DylanQin4/car-simulation.git)
    cd fiara
    ```

2.  **Configurez la base de données :**
    * Créez une base de données PostgreSQL :
        ```sql
        CREATE DATABASE fiara;
        ```
    * Importez le schéma SQL (adaptez `votre_utilisateur` si nécessaire pour la connexion psql) :
        ```bash
        psql -U votre_utilisateur -d fiara -f server/schema.sql
        ```

3.  **Configurez les variables d'environnement :**
    * Créez un fichier `.env` dans le répertoire `server` et ajoutez les variables suivantes (adaptez les valeurs) :
        ```dotenv
        DATABASE_URL=postgresql://votre_utilisateur:mot_de_passe@localhost:5432/fiara
        SIMULATION_TICK_RATE_MS=100
        ```
    * Créez également un fichier `.env.local` dans le répertoire `front` si nécessaire (ou configurez la variable d'environnement système) :
        ```dotenv
        NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
        ```

4.  **Installez les dépendances :**
    * Dans le répertoire `server` :
        ```bash
        npm install
        # ou : yarn install
        ```
    * Dans le répertoire `front` :
        ```bash
        npm install
        # ou : yarn install
        ```

## Utilisation

1.  **Démarrez le backend :**
    * Placez-vous dans le répertoire `server` :
        ```bash
        cd server
        npm run dev
        ```
    * Le backend sera accessible sur `http://localhost:4000`.

2.  **Démarrez le frontend :**
    * Placez-vous dans le répertoire `front` :
        ```bash
        cd ../front 
        # (ou ouvrez un nouveau terminal dans 'front')
        npm run dev
        ```
    * Le frontend sera accessible sur `http://localhost:3000`.

## Commandes Clavier

* **Accélération :** Appuyez sur `Barre d'espace` + un chiffre (`1` à `9`) pour régler le niveau d'accélération (10% à 90%). La touche `a` (ou `0` implicitement) peut être utilisée pour 100%. L'accélération est maintenue tant que la `Barre d'espace` est enfoncée.
* **Freinage :** Maintenez la touche `B` enfoncée pour freiner. Le freinage s'arrête lorsque la touche est relâchée.

## Fonctionnalité Replay

* Cliquez sur le bouton "Replay" dans le tableau de bord pour activer la fonctionnalité.
* Les événements enregistrés dans la base de données seront rejoués à partir du début de la session enregistrée (ou selon la logique implémentée). *(Note : "à partir de l'heure actuelle" peut être ambigu, à clarifier si besoin selon l'implémentation exacte).*

## Tests

Pour exécuter les tests (si disponibles dans le projet) :

```bash
npm run test