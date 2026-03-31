import React, { useEffect, useCallback } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    async function loadFonts() {
      // On web: inject Google Fonts stylesheet
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const existing = document.getElementById('dayflow-fonts');
        if (!existing) {
          const link = document.createElement('link');
          link.id = 'dayflow-fonts';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Geist+Mono:wght@400;500;600&display=swap';
          document.head.appendChild(link);

          // Also set default font on body
          const style = document.createElement('style');
          style.id = 'dayflow-font-defaults';
          style.textContent = `
            * { font-family: 'Instrument Sans', -apple-system, system-ui, sans-serif !important; }
            body { background-color: ${colors.bg}; }
          `;
          document.head.appendChild(style);
        }
        setFontsLoaded(true);
      } else {
        // On native: load fonts via expo-font
        try {
          await Font.loadAsync({
            'InstrumentSans': require('./assets/fonts/InstrumentSans-Regular.ttf'),
            'InstrumentSans-Medium': require('./assets/fonts/InstrumentSans-Medium.ttf'),
            'InstrumentSans-SemiBold': require('./assets/fonts/InstrumentSans-SemiBold.ttf'),
            'InstrumentSans-Bold': require('./assets/fonts/InstrumentSans-Bold.ttf'),
            'GeistMono': require('./assets/fonts/GeistMono-Regular.ttf'),
          });
        } catch {
          // Fonts may not be bundled yet on native — fallback to system fonts
          console.log('[DayFlow] Custom fonts not found, using system fonts');
        }
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <AppNavigator />
    </View>
  );
}
