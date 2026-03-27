import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Activity } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (err) {
    console.warn('[DayFlow] Failed to get push token:', err);
    return null;
  }
}

/**
 * Schedule a local log nudge: fires 30min after activity end_time.
 * Cancels and reschedules if already exists.
 */
export async function scheduleLogNudge(activity: Activity): Promise<void> {
  const endTime = new Date(activity.start_time);
  endTime.setMinutes(endTime.getMinutes() + activity.duration_minutes + 30);

  // Don't schedule nudges for the past
  if (endTime <= new Date()) return;

  // Cancel any existing nudge for this activity
  await cancelLogNudge(activity.id);

  await Notifications.scheduleNotificationAsync({
    identifier: nudgeId(activity.id),
    content: {
      title: `How did "${activity.title}" go?`,
      body: 'Tap to log your experience.',
      data: { type: 'log_nudge', activity_id: activity.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: endTime,
    },
  });
}

export async function cancelLogNudge(activityId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(nudgeId(activityId));
}

function nudgeId(activityId: string): string {
  return `log-nudge-${activityId}`;
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
