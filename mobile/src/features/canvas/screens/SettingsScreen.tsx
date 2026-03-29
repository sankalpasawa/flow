import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
  ScrollView, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radii, typography } from '../../../theme';

// AsyncStorage keys
const PREF_LOG_REMINDERS = 'dayflow_pref_log_reminders';
const PREF_PLANNING_NUDGE = 'dayflow_pref_planning_nudge';
const PREF_MINDSET_PROMPTS = 'dayflow_pref_mindset_prompts';
const PREF_DARK_MODE = 'dayflow_pref_dark_mode';

export function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  const [logReminders, setLogReminders] = useState(true);
  const [planningNudge, setPlanningNudge] = useState(true);
  const [mindsetPrompts, setMindsetPrompts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load persisted preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const [lr, pn, mp, dm] = await Promise.all([
          AsyncStorage.getItem(PREF_LOG_REMINDERS),
          AsyncStorage.getItem(PREF_PLANNING_NUDGE),
          AsyncStorage.getItem(PREF_MINDSET_PROMPTS),
          AsyncStorage.getItem(PREF_DARK_MODE),
        ]);
        if (lr !== null) setLogReminders(lr === 'true');
        if (pn !== null) setPlanningNudge(pn === 'true');
        if (mp !== null) setMindsetPrompts(mp === 'true');
        if (dm !== null) setDarkMode(dm === 'true');
      } catch (e) {
        console.error('[DayFlow] Failed to load preferences:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const toggle = useCallback(
    async (key: string, value: boolean, setter: (v: boolean) => void) => {
      setter(value);
      try {
        await AsyncStorage.setItem(key, String(value));
      } catch (e) {
        console.error('[DayFlow] Failed to save preference:', e);
      }
    },
    [],
  );

  async function handleSignOut() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to sign out?')
      : await new Promise<boolean>((resolve) => {
          const { Alert } = require('react-native');
          Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
            ],
          );
        });
    if (!confirmed) return;
    try {
      await signOut();
    } catch (err) {
      console.error('[DayFlow] Sign out failed:', err);
    }
  }

  if (!loaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Email</Text>
          <Text style={styles.cardValue}>{user?.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Log reminders</Text>
            <Text style={styles.toggleDesc}>Remind me to log after activities</Text>
          </View>
          <Switch
            value={logReminders}
            onValueChange={(v) => toggle(PREF_LOG_REMINDERS, v, setLogReminders)}
            trackColor={{ false: colors.border, true: colors.primaryBg }}
            thumbColor={logReminders ? colors.primary : colors.muted}
          />
        </View>
        <View style={styles.card}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Planning nudge</Text>
            <Text style={styles.toggleDesc}>Evening reminder to plan tomorrow</Text>
          </View>
          <Switch
            value={planningNudge}
            onValueChange={(v) => toggle(PREF_PLANNING_NUDGE, v, setPlanningNudge)}
            trackColor={{ false: colors.border, true: colors.primaryBg }}
            thumbColor={planningNudge ? colors.primary : colors.muted}
          />
        </View>
        <View style={styles.card}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Quiet hours</Text>
          </View>
          <Text style={styles.cardValue}>10 PM — 7 AM</Text>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Mindset prompts</Text>
            <Text style={styles.toggleDesc}>Show AI mindset prompts on activities</Text>
          </View>
          <Switch
            value={mindsetPrompts}
            onValueChange={(v) => toggle(PREF_MINDSET_PROMPTS, v, setMindsetPrompts)}
            trackColor={{ false: colors.border, true: colors.primaryBg }}
            thumbColor={mindsetPrompts ? colors.primary : colors.muted}
          />
        </View>
        <View style={styles.card}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Dark mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={(v) => toggle(PREF_DARK_MODE, v, setDarkMode)}
            trackColor={{ false: colors.border, true: colors.primaryBg }}
            thumbColor={darkMode ? colors.primary : colors.muted}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Version</Text>
          <Text style={styles.cardValue}>DayFlow v1.0.0</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.madeWith}>Made with intention</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: 14 },
  headerTitle: {
    color: colors.text,
    fontSize: typography.headline.fontSize,
    fontWeight: '800',
  },
  content: { padding: spacing.lg, paddingBottom: 48, gap: spacing.sm },
  sectionLabel: {
    color: colors.muted,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  cardLabel: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
  },
  cardValue: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  toggleInfo: { flex: 1, marginRight: spacing.md },
  toggleTitle: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  toggleDesc: {
    color: colors.muted,
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
    marginTop: 2,
  },
  madeWith: {
    color: colors.muted,
    fontSize: typography.body.fontSize,
    fontStyle: 'italic',
  },
  signOutButton: {
    backgroundColor: '#450A0A',
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  signOutText: { color: '#FCA5A5', fontSize: 16, fontWeight: '600' },
});
