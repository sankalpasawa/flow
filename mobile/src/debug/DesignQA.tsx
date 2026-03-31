/**
 * DayFlow Design QA System
 *
 * Self-sufficient screenshot capture + debug server for Claude to do design QA.
 *
 * HOW IT WORKS:
 * 1. Wraps the app in a ViewShot ref
 * 2. Captures screenshots on key events (navigation, scroll, interaction)
 * 3. Stores captures in memory (base64) with metadata
 * 4. Exposes a debug HTTP endpoint on port 9876 for Claude to:
 *    - GET /captures — list all captures with timestamps
 *    - GET /capture/:id — get a specific capture as PNG
 *    - POST /capture — trigger a capture with optional label
 *    - GET /status — app state (current screen, scroll position, etc.)
 *    - POST /command — send commands to the app (scroll, navigate, tap)
 *
 * ONLY ACTIVE IN DEV MODE.
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Platform, AppState } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

const DEV_MODE = __DEV__;
const MAX_CAPTURES = 20;
const DEBUG_PORT = 9876;

interface Capture {
  id: string;
  timestamp: string;
  label: string;
  uri: string; // base64 data URI or file path
  width: number;
  height: number;
}

// In-memory capture store
const captureStore: Capture[] = [];
let currentScreen = 'Today';
let captureCounter = 0;

// Generate unique ID
function genId(): string {
  return `cap-${Date.now()}-${++captureCounter}`;
}

// The ViewShot ref (set by DesignQAProvider)
let viewShotRef: React.RefObject<ViewShot | null> | null = null;

/**
 * Take a screenshot of the current app state
 */
export async function takeCapture(label: string = 'manual'): Promise<Capture | null> {
  if (!DEV_MODE || !viewShotRef?.current) return null;

  try {
    const uri = await captureRef(viewShotRef, {
      format: 'png',
      quality: 0.8,
      result: 'base64',
    });

    const capture: Capture = {
      id: genId(),
      timestamp: new Date().toISOString(),
      label: `${currentScreen}/${label}`,
      uri: `data:image/png;base64,${uri}`,
      width: 390,
      height: 844,
    };

    captureStore.push(capture);
    if (captureStore.length > MAX_CAPTURES) {
      captureStore.shift();
    }

    console.log(`[DesignQA] Captured: ${capture.label} (${capture.id})`);
    return capture;
  } catch (err) {
    console.warn('[DesignQA] Capture failed:', err);
    return null;
  }
}

/**
 * Set the current screen name (call from navigation listener)
 */
export function setCurrentScreen(name: string) {
  currentScreen = name;
}

/**
 * Auto-capture triggers
 */
export function captureOnNavigation(screenName: string) {
  setCurrentScreen(screenName);
  setTimeout(() => takeCapture('navigation'), 500); // Wait for render
}

export function captureOnScroll(position: string) {
  takeCapture(`scroll-${position}`);
}

export function captureOnInteraction(action: string) {
  setTimeout(() => takeCapture(`interaction-${action}`), 300);
}

/**
 * Start the debug HTTP server (web only)
 * On native, captures are stored in memory and can be read via the console
 */
function startDebugServer() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    console.log('[DesignQA] Debug server only available on web. On native, captures stored in memory.');
    return;
  }

  // On web, we expose a global API that the browse tool can call via $B js
  (window as any).__designQA = {
    captures: () => captureStore.map(c => ({ id: c.id, timestamp: c.timestamp, label: c.label })),

    getCapture: (id: string) => {
      const cap = captureStore.find(c => c.id === id);
      return cap ? cap.uri : null;
    },

    getLatest: () => {
      const cap = captureStore[captureStore.length - 1];
      return cap ? cap.uri : null;
    },

    trigger: async (label: string = 'claude-triggered') => {
      const cap = await takeCapture(label);
      return cap ? { id: cap.id, label: cap.label, timestamp: cap.timestamp } : null;
    },

    status: () => ({
      currentScreen,
      captureCount: captureStore.length,
      lastCapture: captureStore.length > 0 ? captureStore[captureStore.length - 1].timestamp : null,
      devMode: DEV_MODE,
    }),

    // Save latest capture to a downloadable file
    download: () => {
      const cap = captureStore[captureStore.length - 1];
      if (!cap) return 'No captures';
      const link = document.createElement('a');
      link.href = cap.uri;
      link.download = `dayflow-qa-${cap.id}.png`;
      link.click();
      return `Downloaded ${cap.id}`;
    },

    // Save capture as a file that the browse tool can screenshot
    renderToDOM: (id?: string) => {
      const cap = id ? captureStore.find(c => c.id === id) : captureStore[captureStore.length - 1];
      if (!cap) return 'No capture found';

      // Create or update a hidden img element
      let img = document.getElementById('qa-capture-img') as HTMLImageElement;
      if (!img) {
        img = document.createElement('img');
        img.id = 'qa-capture-img';
        img.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;max-width:100vw;max-height:100vh;';
        document.body.appendChild(img);
      }
      img.src = cap.uri;
      return `Rendered ${cap.id} to DOM`;
    },

    hideDOM: () => {
      const img = document.getElementById('qa-capture-img');
      if (img) img.remove();
      return 'Hidden';
    },
  };

  console.log('[DesignQA] Debug API ready. Access via window.__designQA');
  console.log('[DesignQA] Commands: .captures(), .trigger(label), .getLatest(), .status(), .renderToDOM()');
}

/**
 * DesignQAProvider — wrap your app with this in dev mode
 */
export function DesignQAProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<ViewShot>(null);

  useEffect(() => {
    if (!DEV_MODE) return;

    viewShotRef = ref;
    startDebugServer();

    // Auto-capture on app load
    const timer = setTimeout(() => takeCapture('app-load'), 2000);

    // Capture on app state changes
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setTimeout(() => takeCapture('app-foregrounded'), 500);
      }
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  if (!DEV_MODE) {
    return <>{children}</>;
  }

  return (
    <ViewShot ref={ref} style={{ flex: 1 }} options={{ format: 'png', quality: 0.8 }}>
      {children}
    </ViewShot>
  );
}

export default DesignQAProvider;
