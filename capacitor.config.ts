import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cargoflow.app',
  appName: 'CargoFlow',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https'
  }
};

export default config;
