
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fynixpro.app',
  appName: 'Fynix Pro',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    // This is required for live-reloading during development.
    // Do not change this unless you know what you are doing.
    "url": "http://localhost:3000",
    "cleartext": true
  }
};

export default config;
