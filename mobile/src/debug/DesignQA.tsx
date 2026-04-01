/**
 * DayFlow Design QA — Smart Capture
 *
 * OFF by default. Claude starts/stops QA mode via the server.
 * While ON: captures once per unique screen. No duplicates.
 *
 * Server endpoints:
 *   POST /qa/start — turn on QA mode
 *   POST /qa/stop  — turn off QA mode
 *   POST /trigger   — force capture of current screen
 *   GET  /status    — check if QA is active
 */

import React, { useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import Constants from 'expo-constants';

const DEV_MODE = __DEV__;
let viewShotRef: React.RefObject<ViewShot | null> | null = null;
let currentScreen = 'Today';
let captureCount = 0;
let qaActive = false;
const capturedScreens = new Set<string>(); // Track which screens we've already captured
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

    console.log(`[DesignQA] 📸 ${filename}`);
  } catch (err) {
    console.log(`[DesignQA] ⚠️ ${err}`);
  }
}

/**
 * Poll server for QA mode changes and trigger requests
 */
function startPolling() {
  if (pollInterval) return;

  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${SERVER()}/qa-state`);
      const data = await res.json();

      // QA mode toggled
      if (data.active && !qaActive) {
        qaActive = true;
        capturedScreens.clear();
        console.log('[DesignQA] 🟢 QA mode ON');
        // Capture current screen immediately
        await captureAndUpload('qa-start');
        capturedScreens.add(currentScreen);
      } else if (!data.active && qaActive) {
        qaActive = false;
        capturedScreens.clear();
        console.log('[DesignQA] 🔴 QA mode OFF');
      }

      // Check for force trigger
      if (data.forceTrigger) {
        await captureAndUpload(data.triggerLabel || 'forced');
        await fetch(`${SERVER()}/ack`, { method: 'POST' });
      }
    } catch {
      // Server not running
    }
  }, 2000);
}

export function setCurrentScreen(name: string) {
  currentScreen = name;
}

export function captureOnNavigation(screenName: string) {
  setCurrentScreen(screenName);

  // Only capture if QA is active AND we haven't captured this screen yet
  if (qaActive && !capturedScreens.has(screenName)) {
    capturedScreens.add(screenName);
    setTimeout(() => captureAndUpload(`nav-${screenName}`), 800);
  }
}

export function captureOnInteraction(action: string) {
  // Only capture if QA is active
  if (qaActive) {
    setTimeout(() => captureAndUpload(`action-${action}`), 500);
  }
}

/**
 * Call this when content changes on a dynamic screen
 * (e.g. scroll position changes visible pills, sheet expands, etc.)
 * Uses a content key to avoid duplicate captures of the same state
 */
const capturedContentKeys = new Set<string>();
export function captureOnContentChange(contentKey: string) {
  if (!qaActive) return;
  const key = `${currentScreen}-${contentKey}`;
  if (capturedContentKeys.has(key)) return;
  capturedContentKeys.add(key);
  setTimeout(() => captureAndUpload(`content-${contentKey}`), 600);
}

export function DesignQAProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<ViewShot>(null);

  useEffect(() => {
    if (!DEV_MODE || Platform.OS === 'web') return;

    viewShotRef = ref;
    startPolling();

    console.log('[DesignQA] Ready. Waiting for QA mode to be activated.');
    console.log(`[DesignQA] Server: ${SERVER()}`);

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
