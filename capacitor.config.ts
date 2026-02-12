import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cervo.app',
  appName: 'ivoiredestock',
  webDir: 'dist',
  plugins: {
    // ⚠️ Change "StatusBar" en "SystemBars" ici
    SystemBars: {
      insetsHandling: "css", // Active l'injection de --safe-area-inset-top
      style: "DARK",  
      hidden: false,
      animation: "NONE"       // Icônes blanches pour ton fond vert
    }
  }
};

export default config;