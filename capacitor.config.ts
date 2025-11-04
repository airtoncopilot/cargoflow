import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.docxpress.app',
  appName: 'DocXpress',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https'
  }
};

export default config;
