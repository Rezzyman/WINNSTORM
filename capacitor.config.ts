import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winnstorm.inspector',
  appName: 'WinnStorm',
  webDir: 'dist/public',
  server: {
    url: 'https://winnstorm.com',
    cleartext: false,
    androidScheme: 'https'
  },
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
      launchAutoHide: true,
      backgroundColor: '#1E293B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      spinnerColor: '#F97316'
    },
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    },
    Preferences: {
      group: 'WinnStormSettings'
    }
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#1E293B',
    preferredContentMode: 'mobile',
    scheme: 'winnstorm'
  },
  android: {
    backgroundColor: '#1E293B',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;
