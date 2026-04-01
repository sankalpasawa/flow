/**
 * DayFlow Design QA System — Expo Native → Mac Bridge
 *
 * Takes screenshots on iPhone, uploads them to a tiny HTTP server
 * running on the dev machine. Claude reads them from disk.
 *
 * Flow:
 * 1. App captures screenshots via ViewShot (on iPhone)
 * 2. Uploads base64 PNG to http://<dev-machine>:9876/upload
 * 3. Server saves to mobile/qa-screenshots/ on the Mac
 * 4. Claude reads them via the Read tool
 *
 * DEV MODE ONLY.
 */

import React, { useRef, useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import Constants from 'expo-constants';

const DEV_MODE = __DEV__;
let viewShotRef: React.RefObject<ViewShot | null> | null = null;
let currentScreen = 'Today';
let captureCount = 0;

// The dev server IP — Expo sets this in the manifest
function getDevServerHost(): string {
  try {
    // Expo Go provides the dev server URL in the manifest
    const debuggerHost = Constants.expoConfig?.hostUri
      || Constants.manifest?.debuggerHost
      || Constants.manifest2?.extra?.expoGo?.debuggerHost
      || '';
    // Extract just the IP (remove port)
    const ip = debuggerHost.split(':')[0];
    return ip || 'localhost';
  } catch {
    return 'localhost';
  }
}

const UPLOAD_URL = () => `http://${getDevServerHost()}:9876/upload`;

/**
 * Take a screenshot and upload to dev machine
 */
export async function takeCapture(label: string = 'manual'): Promise<string | null> {
  if (!DEV_MODE || !viewShotRef?.current) return null;

  // Skip on web — web uses browse tool directly
  if (Platform.OS === 'web') return null;

  try {
    const base64 = await captureRef(viewShotRef, {
      format: 'png',
      quality: 0.9,
      result: 'base64',
    });

    captureCount++;
    const filename = `qa-${captureCount}-${currentScreen.replace(/[^a-zA-Z0-9]/g, '_')}-${label.replace(/[^a-zA-Z0-9]/g, '_')}.png`;

    console.log(`[DesignQA] 📸 #${captureCount} ${currentScreen}/${label}`);

    // Upload to dev machine
    try {
      const url = UPLOAD_URL();
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, base64, screen: currentScreen, label }),
      });
      console.log(`[DesignQA] ⬆️  Uploaded to dev machine: ${filename}`);
    } catch (uploadErr) {
      console.log(`[DesignQA] ⚠️  Upload failed (server not running?): ${uploadErr}`);
      console.log(`[DesignQA] Run the QA server: node mobile/src/debug/qa-server.js`);
    }

    return filename;
  } catch (err) {
    console.warn('[DesignQA] Capture failed:', err);
    return null;
  }
}

export function setCurrentScreen(name: string) {
  currentScreen = name;
}

export function captureOnNavigation(screenName: string) {
  setCurrentScreen(screenName);
  setTimeout(() => takeCapture(`nav-${screenName}`), 800);
}

export function captureOnInteraction(action: string) {
  setTimeout(() => takeCapture(`action-${action}`), 500);
}

// Expose for debugger
if (DEV_MODE && Platform.OS !== 'web') {
  (global as any).__designQA = {
    trigger: takeCapture,
    status: () => ({ currentScreen, captureCount, platform: Platform.OS, uploadUrl: UPLOAD_URL() }),
  };
}

/**
 * Provider — wrap your app
 */
export function DesignQAProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<ViewShot>(null);

  useEffect(() => {
    if (!DEV_MODE || Platform.OS === 'web') return;

    viewShotRef = ref;

    // Auto-capture on app load
    const timer = setTimeout(() => takeCapture('app-load'), 3000);

    // Capture on foreground
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setTimeout(() => takeCapture('foregrounded'), 1000);
      }
    });

    console.log('[DesignQA] 🟢 Ready. Screenshots auto-upload to dev machine.');
    console.log(`[DesignQA] 📡 Upload URL: ${UPLOAD_URL()}`);

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  if (Platform.OS === 'web' || !DEV_MODE) {
    return <>{children}</>;
  }

  return (
    <ViewShot ref={ref} style={{ flex: 1 }} options={{ format: 'png', quality: 0.9 }}>
      {children}
    </ViewShot>
  );
}

export default DesignQAProvider;
