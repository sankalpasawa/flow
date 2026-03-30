import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity } from '../types';

// ─── Preference keys (must match SettingsScreen) ──────────────────────────────
const PREF_LOG_REMINDERS  = 'dayflow_pref_log_reminders';
const PREF_PLANNING_NUDGE = 'dayflow_pref_planning_nudge';
const PREF_QUIET_START    = 'dayflow_pref_quiet_start';
const PREF_QUIET_END      = 'dayflow_pref_quiet_end';

async function isEnabled(key: string): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v === null ? true : v === 'true'; // default on
  } catch { return true; }
}

/** Returns true if the given hour falls within the user's quiet hours. */
async function isQuietHour(hour: number): Promise<boolean> {
  try {
    const [qs, qe] = await Promise.all([
      AsyncStorage.getItem(PREF_QUIET_START),
      AsyncStorage.getItem(PREF_QUIET_END),
    ]);
    const start = qs !== null ? Number(qs) : 22; // default 10 PM
    const end   = qe !== null ? Number(qe) : 7;  // default 7 AM
    // Quiet window may wrap midnight (e.g. 22–7)
    if (start > end) return hour >= start || hour < end;
    return hour >= start && hour < end;
  } catch { return false; }
}

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
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) return;

  // Respect "Log reminders" toggle
  if (!(await isEnabled(PREF_LOG_REMINDERS))) return;

  const endTime = new Date(activity.start_time);
  endTime.setMinutes(endTime.getMinutes() + activity.duration_minutes + 30);

  // Don't schedule nudges for the past
  if (endTime <= new Date()) return;

  // Skip if the nudge would fire during quiet hours
  if (await isQuietHour(endTime.getHours())) return;

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

export async function schedulePlanningNudge(tomorrowActivityCount: number): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!Device.isDevice) return;

  // Respect "Planning nudge" toggle
  if (!(await isEnabled(PREF_PLANNING_NUDGE))) return;

  // Cancel any existing planning nudge
  await cancelPlanningNudge();

  // Only nudge if tomorrow has fewer than 3 activities planned
  if (tomorrowActivityCount >= 3) return;

  // Schedule between 8:00 PM and 9:30 PM tonight
  const now = new Date();
  const nudgeTime = new Date();
  nudgeTime.setHours(20, 0, 0, 0); // 8:00 PM

  // If it's already past 9:30 PM, skip for today
  if (now.getHours() >= 21 && now.getMinutes() > 30) return;

  // If it's past 8 PM, schedule for now + 5 min so it fires soon
  if (now >= nudgeTime) {
    nudgeTime.setTime(now.getTime() + 5 * 60000);
  }

  // Don't schedule if nudge time is in the past
  if (nudgeTime <= now) return;

  const count = tomorrowActivityCount;
  const body = count === 0
    ? "Nothing planned yet — take 2 minutes to set your intentions for tomorrow"
    : `You have ${count} ${count === 1 ? 'activity' : 'activities'} planned — add a few more to fill your day`;

  await Notifications.scheduleNotificationAsync({
    identifier: PLANNING_NUDGE_ID,
    content: {
      title: "Plan your tomorrow \uD83C\uDF05",
      body,
      data: { type: 'planning_nudge' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nudgeTime,
    },
  });
}

export async function cancelPlanningNudge(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(PLANNING_NUDGE_ID).catch(() => {});
}

const PLANNING_NUDGE_ID = 'planning-nudge-tonight';

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
