'use client';

import React from 'react';
import Dashboard from './components/Dashboard';
import { useSocketManager } from './hooks/useSocketManager';
import { useKeyboardInput } from './hooks/useKeyboardInput';

export default function HomePage() {
    const { sendUserInput } = useSocketManager();

    // Initialise la gestion du clavier et lui passe la fonction d'envoi
    useKeyboardInput({ sendInputCallback: sendUserInput, brakeKey: 'b' });

    return (
        <main>
            <Dashboard />
        </main>
    );
}