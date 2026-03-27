// Web shim for notifications — no-ops for web preview
import { Activity } from '../types';

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function getExpoPushToken(): Promise<string | null> {
  return null;
}

export async function scheduleLogNudge(_activity: Activity): Promise<void> {}

export async function cancelLogNudge(_activityId: string): Promise<void> {}

export function addNotificationResponseListener(_handler: (response: any) => void) {
  return { remove: () => {} };
}
