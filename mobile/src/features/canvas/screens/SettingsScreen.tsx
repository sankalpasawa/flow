import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
  ScrollView, Switch, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../../store/authStore';
import { colors, spacing, radii, text, ui, upperLabel } from '../../../theme';

// ─── AsyncStorage keys ────────────────────────────────────────────────────────
const PREF_LOG_REMINDERS    = 'dayflow_pref_log_reminders';
const PREF_PLANNING_NUDGE   = 'dayflow_pref_planning_nudge';
const PREF_MINDSET_PROMPTS  = 'dayflow_pref_mindset_prompts';
const PREF_QUIET_START      = 'dayflow_pref_quiet_start';   // 0-23
const PREF_QUIET_END        = 'dayflow_pref_quiet_end';     // 0-23
const PREF_DAY_START        = 'dayflow_pref_day_start';     // 0-23

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtHour(h: number): string {
  if (h === 0)  return '12 AM';
  if (h < 12)   return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

const QUIET_START_OPTIONS = [20, 21, 22, 23];   // 8 PM – 11 PM
const QUIET_END_OPTIONS   = [5, 6, 7, 8, 9];    // 5 AM – 9 AM
const DAY_START_OPTIONS   = [4, 5, 6, 7, 8, 9]; // 4 AM – 9 AM

// ─── Inline picker modal ──────────────────────────────────────────────────────
interface PickerProps {
  visible: boolean;
  title: string;
  options: number[];
  value: number;
  onSelect: (v: number) => void;
  onClose: () => void;
}
function HourPicker({ visible, title, options, value, onSelect, onClose }: PickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={picker.overlay} activeOpacity={1} onPress={onClose}>
        <View style={picker.sheet}>
          <Text style={picker.title}>{title}</Text>
          {options.map(h => (
            <TouchableOpacity
              key={h}
              style={[picker.row, h === value && picker.rowSelected]}
              onPress={() => { onSelect(h); onClose(); }}
            >
              <Text style={[picker.rowText, h === value && picker.rowTextSelected]}>
                {fmtHour(h)}
              </Text>
              {h === value && <Text style={picker.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const picker = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  sheet: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, minWidth: 220 },
  title: { ...text.label, color: colors.muted, textAlign: 'center', marginBottom: spacing.sm },
  row: { paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: radii.sm, flexDirection: 'row', justifyContent: 'space-between' },
  rowSelected: { backgroundColor: colors.primaryBg },
  rowText: { ...text.body, color: colors.text2 },
  rowTextSelected: { color: colors.primary, fontWeight: '600' },
  check: { color: colors.primary, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  const [logReminders,   setLogReminders]   = useState(true);
  const [planningNudge,  setPlanningNudge]  = useState(true);
  const [mindsetPrompts, setMindsetPrompts] = useState(true);
  const [quietStart,     setQuietStart]     = useState(22); // 10 PM
  const [quietEnd,       setQuietEnd]       = useState(7);  // 7 AM
  const [dayStart,       setDayStart]       = useState(6);  // 6 AM
  const [loaded,         setLoaded]         = useState(false);

  const [activePicker, setActivePicker] = useState<'quietStart' | 'quietEnd' | 'dayStart' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [lr, pn, mp, qs, qe, ds] = await Promise.all([
          AsyncStorage.getItem(PREF_LOG_REMINDERS),
          AsyncStorage.getItem(PREF_PLANNING_NUDGE),
          AsyncStorage.getItem(PREF_MINDSET_PROMPTS),
          AsyncStorage.getItem(PREF_QUIET_START),
          AsyncStorage.getItem(PREF_QUIET_END),
          AsyncStorage.getItem(PREF_DAY_START),
        ]);
        if (lr !== null) setLogReminders(lr === 'true');
        if (pn !== null) setPlanningNudge(pn === 'true');
        if (mp !== null) setMindsetPrompts(mp === 'true');
        if (qs !== null) setQuietStart(Number(qs));
        if (qe !== null) setQuietEnd(Number(qe));
        if (ds !== null) setDayStart(Number(ds));
      } catch (e) {
        console.error('[DayFlow] Failed to load preferences:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const toggle = useCallback(async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (e) {
      console.error('[DayFlow] Failed to save preference:', e);
    }
  }, []);

  const pickHour = useCallback(async (key: string, value: number, setter: (v: number) => void) => {
    setter(value);
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (e) {
      console.error('[DayFlow] Failed to save preference:', e);
    }
  }, []);

  async function handleSignOut() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to sign out?')
      : await new Promise<boolean>((resolve) => {
          const { Alert } = require('react-native');
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (!confirmed) return;
    try { await signOut(); } catch (err) { console.error('[DayFlow] Sign out failed:', err); }
  }

  if (!loaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Account ── */}
        <Text style={styles.sectionLabel}>{upperLabel('Account')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Email</Text>
          <Text style={styles.cardValue}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} accessibilityRole="button">
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* ── Notifications ── */}
        <Text style={styles.sectionLabel}>{upperLabel('Notifications')}</Text>
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

        {/* ── Quiet hours ── */}
        <Text style={styles.sectionLabel}>{upperLabel('Quiet Hours')}</Text>
        <Text style={styles.sectionHint}>No notifications will be sent during this window.</Text>
        <TouchableOpacity style={styles.card} onPress={() => setActivePicker('quietStart')} accessibilityRole="button">
          <Text style={styles.cardLabel}>Start</Text>
          <View style={styles.valueRow}>
            <Text style={styles.cardValue}>{fmtHour(quietStart)}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => setActivePicker('quietEnd')} accessibilityRole="button">
          <Text style={styles.cardLabel}>End</Text>
          <View style={styles.valueRow}>
            <Text style={styles.cardValue}>{fmtHour(quietEnd)}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* ── Preferences ── */}
        <Text style={styles.sectionLabel}>{upperLabel('Preferences')}</Text>
        <TouchableOpacity style={styles.card} onPress={() => setActivePicker('dayStart')} accessibilityRole="button">
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Day starts at</Text>
            <Text style={styles.toggleDesc}>First hour shown on the canvas</Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.cardValue}>{fmtHour(dayStart)}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
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

        {/* ── About ── */}
        <Text style={styles.sectionLabel}>{upperLabel('About')}</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Version</Text>
          <Text style={styles.cardValue}>DayFlow v1.0.0</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.madeWith}>Made with intention</Text>
        </View>

      </ScrollView>

      {/* ── Pickers ── */}
      <HourPicker
        visible={activePicker === 'quietStart'}
        title="Quiet hours start"
        options={QUIET_START_OPTIONS}
        value={quietStart}
        onSelect={(v) => pickHour(PREF_QUIET_START, v, setQuietStart)}
        onClose={() => setActivePicker(null)}
      />
      <HourPicker
        visible={activePicker === 'quietEnd'}
        title="Quiet hours end"
        options={QUIET_END_OPTIONS}
        value={quietEnd}
        onSelect={(v) => pickHour(PREF_QUIET_END, v, setQuietEnd)}
        onClose={() => setActivePicker(null)}
      />
      <HourPicker
        visible={activePicker === 'dayStart'}
        title="Day starts at"
        options={DAY_START_OPTIONS}
        value={dayStart}
        onSelect={(v) => pickHour(PREF_DAY_START, v, setDayStart)}
        onClose={() => setActivePicker(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  header:       { paddingHorizontal: spacing.lg, paddingVertical: 14 },
  headerTitle:  { ...text.screenTitle, color: colors.text },
  content:      { padding: spacing.lg, paddingBottom: 48, gap: spacing.sm },
  sectionLabel: { ...text.label, color: colors.muted, letterSpacing: 1, marginTop: spacing.md, marginBottom: 2 },
  sectionHint:  { ...text.caption, color: colors.faint, marginBottom: spacing.xs },
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
  cardLabel:   { ...text.body, color: colors.muted },
  cardValue:   { ...text.body, color: colors.text, fontWeight: '500' },
  valueRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chevron:     { color: colors.muted, fontSize: 20, lineHeight: 22 },
  toggleInfo:  { flex: 1, marginRight: spacing.md },
  toggleTitle: { ...text.body, color: colors.text, fontWeight: '500' },
  toggleDesc:  { ...text.caption, color: colors.muted, marginTop: 2 },
  madeWith:    { ...text.body, color: colors.muted, fontStyle: 'italic' },
  signOutButton: {
    backgroundColor: '#450A0A',
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  signOutText: { color: '#FCA5A5', fontSize: 16, fontWeight: '600' },
});
