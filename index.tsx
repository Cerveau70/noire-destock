import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';
import App from './App';

// Initialiser SystemBars pour Android (injecte --safe-area-inset-x)
const initSystemBars = async () => {
  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark });
  } catch (error) {
    // SystemBars n'est pas disponible sur web, c'est normal
    console.log('SystemBars not available (web platform)');
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialiser SystemBars avant de rendre l'app
initSystemBars().then(() => {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

registerSW({ immediate: true });