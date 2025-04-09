import { useState, useEffect, useRef } from 'react';
import { UserInputState } from '../types'; // Assurez-vous que ce chemin est correct

interface KeyboardInputProps {
    sendInputCallback: (input: UserInputState) => void;
    brakeKey?: string; // Default: 'b'
}

export const useKeyboardInput = ({
    sendInputCallback,
    brakeKey = 'b',
}: KeyboardInputProps) => {
    // etats pour suivre l'etat physique des touches
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isBrakePressed, setIsBrakePressed] = useState(false);
    const [pressedDigit, setPressedDigit] = useState<number | null>(null);

    // useRef pour garder la derniere valeur envoyee et eviter les envois redondants
    const lastSentInput = useRef<UserInputState>({ accelerationLevel: 0, isBraking: false });
    
    // --- Effet pour gerer les ecouteurs d'evenements ---
    useEffect(() => {
        console.log("Attaching keyboard listeners..."); // Pour debogage

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) return;

            if (event.key === ' ') {
                setIsSpacePressed(true); // Directly set state
            } else if (event.key.toLowerCase() === brakeKey.toLowerCase()) {
                setIsBrakePressed(true); // Directly set state
            } else if (event.key >= '1' && event.key <= '9') {
                const digit = parseInt(event.key, 10);
                setPressedDigit(digit); // Directly set state
            } else if (event.key === 'a' || event.key === 'A') {
                 const digit = 0; // Utiliser 0 pour representer 'a' (100%)
                 setPressedDigit(digit); // Directly set state
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === ' ') {
                setIsSpacePressed(false);
                setPressedDigit(null); // Reset digit when space is released
            } else if (event.key.toLowerCase() === brakeKey.toLowerCase()) {
                setIsBrakePressed(false);
            } else if (event.key >= '1' && event.key <= '9') {
                 const digit = parseInt(event.key, 10);
                 // Only reset the digit if it matches the one being released
                 setPressedDigit(prev => (prev === digit ? null : prev));
            } else if (event.key === 'a' || event.key === 'A') {
                 // Only reset if 'a' (digit 0) was the active digit
                 setPressedDigit(prev => (prev === 0 ? null : prev));
            }
        };

        const handleBlur = () => {
            console.log("Window blurred, resetting input states");
            setIsSpacePressed(false);
            setIsBrakePressed(false);
            setPressedDigit(null);
        };

        // Attacher les ecouteurs
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        // Nettoyage
        return () => {
            console.log("Removing keyboard listeners...");
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, [sendInputCallback, brakeKey]);

    // --- Effet pour calculer et envoyer l'etat base sur les changements d'etat ---
    useEffect(() => {
        // Valeurs par defaut pour l'iteration actuelle
        let currentAccelerationLevel = 0;
        // isBraking est directement determine par l'etat physique de la touche de frein
        const currentIsBraking = isBrakePressed; 

        // Determiner le niveau d'acceleration
        if (currentIsBraking) {
            // Si on freine, l'acceleration est toujours zero
            currentAccelerationLevel = 0;
        } else if (isSpacePressed) {
            // Si la barre d'espace est enfoncee ET qu'un chiffre est actif
            if (pressedDigit !== null) {
                // Calculer l'acceleration basee sur le chiffre
                currentAccelerationLevel = pressedDigit === 0 ? 1.0 : pressedDigit / 10.0;
            } else {
                // Si la barre d'espace est enfoncee MAIS aucun chiffre n'est actif 
                // (ex: le chiffre vient d'etre relâche mais pas l'espace),
                // on MAINTIENT le dernier niveau d'acceleration envoye.
                currentAccelerationLevel = lastSentInput.current.accelerationLevel;
            }
        } else {
            // Si ni le frein ni la barre d'espace ne sont enfonces, l'acceleration est zero
            currentAccelerationLevel = 0;
        }

        // Construire l'etat d'entree actuel base sur les calculs
        const currentInput: UserInputState = {
            accelerationLevel: currentAccelerationLevel,
            isBraking: currentIsBraking,
        };

        // Envoyer seulement si l'etat calcule a change par rapport au dernier etat envoye
        if (
            currentInput.accelerationLevel !== lastSentInput.current.accelerationLevel ||
            currentInput.isBraking !== lastSentInput.current.isBraking
        ) {
            console.log("Input state changed, sending:", currentInput); // Pour debogage
            sendInputCallback(currentInput);
            // Mettre a jour la reference du dernier etat envoye
            lastSentInput.current = currentInput;
        } 
        // else {
        //      console.log("Input state unchanged, not sending.", currentInput); // Pour debogage
        // }

    // Cet effet s'execute a chaque fois qu'un des etats d'entree change
    }, [isSpacePressed, pressedDigit, isBrakePressed, sendInputCallback]); 
    // lastSentInput n'est PAS dans les dependances car c'est un ref, on lit juste sa valeur .current
};