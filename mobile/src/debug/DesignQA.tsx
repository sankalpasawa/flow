/**
 * DayFlow Design QA System — Expo Native
 *
 * Captures screenshots on key events for design review.
 * Saves to app's cache directory. Logs paths to console.
 *
 * On iPhone: captures auto-save on navigation, app load, interactions.
 * Access via: Expo DevTools console, or shake → "Show Dev Menu" → debug logs.
 *
 * Global API (via RN debugger):
 *   __designQA.trigger('label') — take a screenshot
 *   __designQA.status() — current state
 *
 * DEV MODE ONLY.
 */

import React, { useRef, useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

const DEV_MODE = __DEV__;
let viewShotRef: React.RefObject<ViewShot | null> | null = null;
let currentScreen = 'Today';
let captureCount = 0;

/**
 * Take a screenshot. Saves to temp file, logs path.
 */
export async function takeCapture(label: string = 'manual'): Promise<string | null> {
  if (!DEV_MODE || !viewShotRef?.current || Platform.OS === 'web') return null;

  try {
    const uri = await captureRef(viewShotRef, {
      format: 'png',
      quality: 0.9,
      result: 'tmpfile',
    });

    captureCount++;
    console.log(`[DesignQA] 📸 #${captureCount} ${currentScreen}/${label}`);
    console.log(`[DesignQA] 📁 ${uri}`);
    return uri;
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
  setTimeout(() => takeCapture(`nav-${screenName}`), 600);
}

export function captureOnInteraction(action: string) {
  setTimeout(() => takeCapture(`action-${action}`), 400);
}

// Expose globally for debugger
if (DEV_MODE && Platform.OS !== 'web') {
  (global as any).__designQA = {
    trigger: takeCapture,
    status: () => ({ currentScreen, captureCount, platform: Platform.OS }),
  };
}

/**
 * DesignQAProvider — wrap your app
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
        setTimeout(() => takeCapture('foregrounded'), 800);
      }
    });

    console.log('[DesignQA] 🟢 Ready. Auto-capturing on navigation + app events.');
    console.log('[DesignQA] Use __designQA.trigger("label") in debugger for manual captures.');

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
