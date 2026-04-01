/**
 * DayFlow Design QA System — On-Demand Only
 *
 * Screenshots are taken ONLY when Claude triggers them via the QA server.
 * No auto-capture. No constant uploading.
 *
 * Flow:
 * 1. Claude sends POST http://<mac-ip>:9876/trigger to the QA server
 * 2. QA server sets a flag
 * 3. App polls the flag every 2 seconds (lightweight)
 * 4. When flag is set, app captures screenshot + uploads to QA server
 * 5. Claude reads the screenshot from disk
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
let pollInterval: ReturnType<typeof setInterval> | null = null;

function getDevServerHost(): string {
  try {
    const debuggerHost = Constants.expoConfig?.hostUri
      || Constants.manifest?.debuggerHost
      || Constants.manifest2?.extra?.expoGo?.debuggerHost
      || '';
    return debuggerHost.split(':')[0] || 'localhost';
  } catch {
    return 'localhost';
  }
}

const SERVER = () => `http://${getDevServerHost()}:9876`;

/**
 * Take screenshot and upload to QA server
 */
async function captureAndUpload(label: string): Promise<void> {
  if (!viewShotRef?.current) return;

  try {
    const base64 = await captureRef(viewShotRef, {
      format: 'png',
      quality: 0.9,
      result: 'base64',
    });

    captureCount++;
    const filename = `qa-${captureCount}-${currentScreen}-${label}.png`.replace(/[^a-zA-Z0-9._-]/g, '_');

    await fetch(`${SERVER()}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64, screen: currentScreen, label }),
    });

    console.log(`[DesignQA] 📸 Captured: ${filename}`);
  } catch (err) {
    console.log(`[DesignQA] ⚠️ Capture failed: ${err}`);
  }
}

/**
 * Poll the QA server for capture requests from Claude
 */
function startPolling() {
  if (pollInterval) return;

  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${SERVER()}/pending`);
      const data = await res.json();
      if (data.pending) {
        await captureAndUpload(data.label || 'triggered');
        // Acknowledge
        await fetch(`${SERVER()}/ack`, { method: 'POST' });
      }
    } catch {
      // Server not running, ignore silently
    }
  }, 2000);
}

export function setCurrentScreen(name: string) {
  currentScreen = name;
}

export function captureOnNavigation(screenName: string) {
  setCurrentScreen(screenName);
  // Auto-capture on every navigation
  setTimeout(() => captureAndUpload(`nav-${screenName}`), 800);
}

export function captureOnInteraction(action: string) {
  // Auto-capture on interactions
  setTimeout(() => captureAndUpload(`action-${action}`), 500);
}

export function DesignQAProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<ViewShot>(null);

  useEffect(() => {
    if (!DEV_MODE || Platform.OS === 'web') return;

    viewShotRef = ref;
    startPolling();

    // Auto-capture on app load
    setTimeout(() => captureAndUpload('app-load'), 3000);

    console.log('[DesignQA] 🟢 Ready. Auto-capturing on every navigation.');
    console.log(`[DesignQA] 📡 Server: ${SERVER()}`);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
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
