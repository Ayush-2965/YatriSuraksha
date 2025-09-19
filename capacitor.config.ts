import type { CapacitorConfig } from '@capacitor/cli';import type { CapacitorConfig } from '@capacitor/cli';import { CapacitorConfig } from '@capacitor/cli';



const config: CapacitorConfig = {

  appId: 'com.yatrisuraksha.app',

  appName: 'Yatri Suraksha',const config: CapacitorConfig = {const config: CapacitorConfig = {

  webDir: 'dist',

  bundledWebRuntime: false,  appId: 'com.yatrisuraksha.app',  appId: 'com.yatrisuraksha.app',

  server: {

    androidScheme: 'https'  appName: 'Yatri Suraksha',  appName: 'Yatri Suraksha',

  },

  plugins: {  webDir: 'dist',  webDir: 'dist',

    SplashScreen: {

      launchShowDuration: 3000,  bundledWebRuntime: false,  server: {

      launchAutoHide: true,

      backgroundColor: "#3B82F6",  server: {    androidScheme: 'https'

      androidSplashResourceName: "splash",

      androidScaleType: "CENTER_CROP",    androidScheme: 'https'  },

      showSpinner: true,

      androidSpinnerStyle: "large",  },  plugins: {

      iosSpinnerStyle: "small",

      spinnerColor: "#ffffff",  plugins: {    SplashScreen: {

      splashFullScreen: true,

      splashImmersive: true    SplashScreen: {      launchShowDuration: 2000,

    },

    StatusBar: {      launchShowDuration: 3000,      backgroundColor: "#3B82F6",

      style: "DARK"

    },      launchAutoHide: true,      showSpinner: false,

    Geolocation: {

      requestPermissions: true      backgroundColor: "#3B82F6",      splashFullScreen: true,

    },

    PushNotifications: {      androidSplashResourceName: "splash",      splashImmersive: true

      presentationOptions: ["badge", "sound", "alert"]

    },      androidScaleType: "CENTER_CROP",    },

    App: {

      forceStatusBarStyle: true      showSpinner: true,    StatusBar: {

    }

  },      androidSpinnerStyle: "large",      style: "dark",

  android: {

    buildOptions: {      iosSpinnerStyle: "small",      backgroundColor: "#3B82F6"

      keystorePath: undefined,

      keystorePassword: undefined,      spinnerColor: "#ffffff",    },

      keystoreAlias: undefined,

      keystoreAliasPassword: undefined,      splashFullScreen: true,    PushNotifications: {

      releaseType: 'APK'

    }      splashImmersive: true      presentationOptions: ["badge", "sound", "alert"]

  }

};    },    },



export default config;    StatusBar: {    BackgroundMode: {

      style: "DARK"      notifications: true,

    },      title: 'YatriSuraksha is tracking your location',

    Geolocation: {      text: 'Keep your tour safe with continuous location monitoring',

      requestPermissions: true      silent: false,

    },      resume: true

    PushNotifications: {    }

      presentationOptions: ["badge", "sound", "alert"]  },

    },  android: {

    App: {    allowMixedContent: true,

      forceStatusBarStyle: true    captureInput: true,

    }    webContentsDebuggingEnabled: true

  },  }

  android: {};

    buildOptions: {

      keystorePath: undefined,export default config;
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;