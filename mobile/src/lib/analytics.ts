/**
 * Analytics — thin PostHog REST wrapper.
 *
 * Uses the PostHog `/capture` REST endpoint directly so there are no native
 * dependencies. Works identically on web and native.
 *
 * Setup:
 *   Set EXPO_PUBLIC_POSTHOG_KEY in .env to your PostHog project API key.
 *   Leave blank to disable analytics (e.g. local dev with seed accounts).
 *
 * Usage:
 *   import { analytics } from '../lib/analytics';
 *   analytics.identify(user.id, { email: user.email });
 *   analytics.track('activity_created', { type: 'TIME_BLOCK', category: 'sys-health' });
 *
 * Events tracked:
 *   sign_in           method: 'local' | 'supabase'
 *   sign_out
 *   activity_created  type, category_id
 *   activity_updated  type, category_id
 *   activity_deleted
 *   activity_completed type
 *   log_submitted     mood, energy, completion_pct
 *   goal_created      metric_type, frequency
 *   goal_updated
 *   goal_deleted
 */

const POSTHOG_HOST = 'https://app.posthog.com';
const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';

// Disabled when no key is set (local dev, seed accounts, CI)
const enabled = Boolean(API_KEY);

// Stable anonymous ID before the user is identified
let _distinctId = 'anonymous';

function send(payload: Record<string, unknown>) {
  if (!enabled) return;
  // Fire-and-forget — never block the UI on analytics
  fetch(`${POSTHOG_HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: API_KEY, ...payload }),
  }).catch(() => {}); // Swallow network errors silently
}

export const analytics = {
  /**
   * Identify the current user. Call after sign-in.
   * Sets the distinct_id for all subsequent track() calls.
   */
  identify(userId: string, properties?: Record<string, unknown>) {
    _distinctId = userId;
    send({
      event: '$identify',
      distinct_id: userId,
      properties: { $set: properties ?? {} },
    });
  },

  /**
   * Track an event.
   * @param event  Snake_case event name (e.g. 'activity_created')
   * @param properties  Flat object of event properties
   */
  track(event: string, properties?: Record<string, unknown>) {
    send({
      event,
      distinct_id: _distinctId,
      properties: {
        $lib: 'dayflow-mobile',
        ...properties,
      },
    });
  },

  /** Reset identity on sign-out. */
  reset() {
    _distinctId = 'anonymous';
  },
};
