import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { DesignQAProvider } from './src/debug/DesignQA';
import { colors } from './src/theme';

export default function App() {
  // Load web fonts
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const existing = document.getElementById('dayflow-fonts');
      if (!existing) {
        const link = document.createElement('link');
        link.id = 'dayflow-fonts';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Geist+Mono:wght@400;500;600&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.id = 'dayflow-font-defaults';
        style.textContent = `
          * { font-family: 'Instrument Sans', -apple-system, system-ui, sans-serif !important; }
          body { background-color: ${colors.bg}; margin: 0; }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <DesignQAProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <AppNavigator />
      </View>
    </DesignQAProvider>
  );
}
