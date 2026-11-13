// Capacitor 7 configuration for Android 14 / 15 / 16 (API 34 - 36) APK builds.
// Used when packaging the Vite `dist` bundle with `@capacitor/cli` & `@capacitor/android`.
const capacitorConfig = {
  appId: 'com.rajalpublicschool.erp',
  appName: 'RAJAL PUBLIC SCHOOL RAJALDESAR',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    adjustMarginsForEdgeToEdge: 'auto',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
  },
};

export default capacitorConfig;
