import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winnstorm.inspector',
  appName: 'WinnStorm',
  webDir: 'dist/public',
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen',
      saveToGallery: true,
      quality: 90,
      allowEditing: false,
      resultType: 'base64',
      source: 'camera'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1E293B',
      showSpinner: false
    }
  },
  ios: {
    contentInset: 'always'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;
