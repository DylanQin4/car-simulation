'use client'; // Necessaire pour utiliser Redux Provider

import { Provider } from 'react-redux';
import { store } from './store/store';
import './globals.css'; // Assurez-vous d'avoir un fichier CSS global

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          {children}
        </Provider>
      </body>
    </html>
  )
}