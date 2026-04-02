/**
 * DayFlow Design QA — Smart Capture + Remote Control
 *
 * OFF by default. Claude starts/stops QA mode via the server.
 * While ON: captures once per unique screen. No duplicates.
 * Remote commands allow Claude to navigate screens and control the app.
 *
 * Server endpoints:
 *   POST /qa/start  — turn on QA mode
 *   POST /qa/stop   — turn off QA mode
 *   POST /trigger   — force capture of current screen
 *   POST /command   — send navigation/control command
 *   GET  /qa-state  — poll for QA state + pending commands
 *
 * Commands:
 *   navigate:ActivityForm       — push ActivityForm screen
 *   navigate:Main               — reset to main tab navigator
 *   navigate:ExperienceLog:ID   — open experience log for activity
 *   tab:Plan|Insights|Settings|Today — switch tab
 *   expandTaskBar               — expand bottom task bar
 *   collapseTaskBar             — collapse bottom task bar
 */

import React, { useRef, useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import Constants from 'expo-constants';

const DEV_MODE = __DEV__;
let viewShotRef: React.RefObject<ViewShot | null> | null = null;
let currentScreen = 'Today';
let captureCount = 0;
let qaActive = false;
const capturedScreens = new Set<string>(); // Track which screens we've already captured
let pollInterval: ReturnType<typeof setInterval> | null = null;
let lastCommandId: string | null = null;
let qaActiveListener: ((active: boolean) => void) | null = null;

// Global navigation ref for remote control
let navigationRef: any = null;

export function setNavigationRef(ref: any) {
  navigationRef = ref;
}

// Global task bar control callbacks (set by BottomTaskBar)
let taskBarExpandFn: (() => void) | null = null;
let taskBarCollapseFn: (() => void) | null = null;

export function registerTaskBarControls(expand: () => void, collapse: () => void) {
  taskBarExpandFn = expand;
  taskBarCollapseFn = collapse;
}

export function unregisterTaskBarControls() {
  taskBarExpandFn = null;
  taskBarCollapseFn = null;
}

function executeCommand(command: string) {
  if (!command) return;

  console.log(`[DesignQA] Executing command: ${command}`);

  if (command.startsWith('navigate:')) {
    const target = command.slice('navigate:'.length);
    if (!navigationRef) {
      console.log('[DesignQA] No navigation ref available');
      return;
    }
    if (target === 'Main') {
      // Go back to the main tab navigator
      navigationRef.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else if (target.startsWith('ExperienceLog:')) {
      const activityId = target.slice('ExperienceLog:'.length);
      navigationRef.navigate('ExperienceLog', { activityId });
    } else {
      navigationRef.navigate(target);
    }
  } else if (command.startsWith('tab:')) {
    const tabName = command.slice('tab:'.length);
    if (!navigationRef) {
      console.log('[DesignQA] No navigation ref available');
      return;
    }
    // Navigate to Main first, then switch tab
    navigationRef.navigate('Main', { screen: tabName });
  } else if (command === 'expandTaskBar') {
    if (taskBarExpandFn) taskBarExpandFn();
    else console.log('[DesignQA] TaskBar expand not registered');
  } else if (command === 'collapseTaskBar') {
    if (taskBarCollapseFn) taskBarCollapseFn();
    else console.log('[DesignQA] TaskBar collapse not registered');
  } else {
    console.log(`[DesignQA] Unknown command: ${command}`);
  }
}

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
        qaActiveListener?.(true);
        capturedScreens.clear();
        console.log('[DesignQA] 🟢 QA mode ON');
        // Capture current screen immediately
        await captureAndUpload('qa-start');
        capturedScreens.add(currentScreen);
      } else if (!data.active && qaActive) {
        qaActive = false;
        qaActiveListener?.(false);
        capturedScreens.clear();
        console.log('[DesignQA] 🔴 QA mode OFF');
      }

      // Check for remote command
      if (data.command && data.commandId && data.commandId !== lastCommandId) {
        lastCommandId = data.commandId;
        executeCommand(data.command);
        setTimeout(() => captureAndUpload(`cmd-${data.command}`), 1000);
        await fetch(`${SERVER()}/ack-cmd`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commandId: data.commandId }),
        });
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
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (!DEV_MODE || Platform.OS === 'web') return;

    viewShotRef = ref;
    qaActiveListener = setBannerVisible;
    startPolling();

    console.log('[DesignQA] Ready. Waiting for QA mode to be activated.');
    console.log(`[DesignQA] Server: ${SERVER()}`);

    return () => {
      qaActiveListener = null;
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
      {bannerVisible && (Platform.OS === 'ios' || Platform.OS === 'android') && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, backgroundColor: 'rgba(196,121,91,0.9)', zIndex: 9999, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>QA Testing</Text>
        </View>
      )}
    </ViewShot>
  );
}

export default DesignQAProvider;
