import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socket } from '../lib/socket';
import {
    setConnected,
    setInitialData,
    updateSimulationState,
    setError,
} from '../store/simulationSlice';
import { SimulationState, Car, UserInputState } from '../types'; // Assurez-vous que les types sont corrects
import { Socket } from 'socket.io-client';

export const useSocketManager = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        // --- Gestionnaires d'evenements Socket ---
        const onConnect = () => {
            dispatch(setConnected(true));
            console.log('Socket connected hook, requesting initial state...');
            socket.emit('requestInitialState'); // Demander l'etat des la connexion
        };

        const onDisconnect = (reason: Socket.DisconnectReason) => {
            dispatch(setConnected(false));
             dispatch(setError(`Disconnected: ${reason}`));
            console.warn('Socket disconnected:', reason);
             if (reason === "io server disconnect") {
                // Le serveur a coupe la connexion, on peut essayer de se reconnecter manuellement ici si necessaire.
                 // socket.connect(); // Attention aux boucles infinies
             }
        };

        const onInitialState = (state: SimulationState, car: Car) => {
            console.log('Received initial state:', state, car);
             if (state && car) {
                dispatch(setInitialData({ state, car }));
             } else {
                 console.error("Received invalid initial data");
                  dispatch(setError("Received invalid initial data from server"));
             }
        };

        const onSimulationUpdate = (state: SimulationState) => {
            // console.log("Received state update:", state); // Beaucoup de logs
             if(state) {
                 dispatch(updateSimulationState(state));
             }
        };

         const onError = (message: string) => {
             console.error("Socket Error:", message);
             dispatch(setError(message));
         };

        // --- Enregistrement des gestionnaires ---
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('initialState', onInitialState);
        socket.on('simulationUpdate', onSimulationUpdate);
        socket.on('error', onError);

        // --- Connexion initiale ---
        // Ne connecter que si on n'est pas deja connecte ou en cours de connexion
        if (!socket.connected) {
            console.log("Attempting to connect socket...");
            socket.connect();
        } else {
             // Si deja connecte (ex: HMR), redemander l'etat initial
             console.log("Socket already connected, requesting initial state again...");
             onConnect(); // Appeler pour redemander l'etat
        }


        // --- Nettoyage a la desinstallation du composant ---
        return () => {
            console.log("Cleaning up socket listeners...");
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('initialState', onInitialState);
            socket.off('simulationUpdate', onSimulationUpdate);
            socket.off('error', onError);
            // Optionnel : deconnecter le socket lors du demontage complet de l'app
            // if (socket.connected) {
            //     console.log("Disconnecting socket on cleanup...");
            //     socket.disconnect();
            //     dispatch(resetState()); // Reset redux state on full disconnect
            // }
        };
    }, [dispatch]); // Le dispatch ne change jamais, donc l'effet s'execute une fois au montage

    // --- Fonction pour envoyer l'etat des inputs ---
    const sendUserInput = (input: UserInputState) => {
        if (socket.connected) {
            socket.emit('updateInput', input);
        } else {
            console.warn("Socket not connected. Cannot send input.");
        }
    };

    return { sendUserInput }; // Retourne la fonction pour envoyer les inputs
};