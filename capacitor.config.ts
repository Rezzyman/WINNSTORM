import type { CapacitorConfig } from '@capacitor/cli';

// CAPACITOR_BUNDLED=true  -> Uses bundled assets (for UI testing)
// CAPACITOR_LOCAL=true    -> Connects to localhost:3000 (for dev with backend)
// Neither                 -> Connects to winnstorm.com (production)
const useBundled = process.env.CAPACITOR_BUNDLED === 'true';
const useLocalServer = process.env.CAPACITOR_LOCAL === 'true';

const getServerConfig = () => {
  if (useBundled) {
    // Use bundled assets - no server URL
    return { appendUserAgent: 'Capacitor WinnStorm' };
  }
  if (useLocalServer) {
    // Local development - connects to your local server
    return {
      url: 'http://localhost:3000',
      cleartext: true,
      androidScheme: 'http',
      appendUserAgent: 'Capacitor WinnStorm'
    };
  }
  // Production - connects to winnstorm.com
  return {
    url: 'https://winnstorm.com',
    cleartext: false,
    androidScheme: 'https',
    appendUserAgent: 'Capacitor WinnStorm'
  };
};

const config: CapacitorConfig = {
  appId: 'com.winnstorm.inspector',
  appName: 'WinnStorm',
  webDir: 'dist/mobile',
  server: getServerConfig(),
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
