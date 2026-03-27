import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { parseISO, addMinutes } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { FREE_TIER_LOG_LIMIT, WouldRepeat, LogPhase } from '../../../types';
import { isEditWindowOpen, countTodayLogs } from '../../../lib/db/logs';

interface Props {
  route: { params?: { activityId?: string; editMode?: boolean } };
  navigation: { goBack: () => void };
}

const MOOD = [
  { value: 1, emoji: '😫', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
];

const ENERGY = [
  { value: 1, emoji: '🪫', label: 'Drained' },
  { value: 2, emoji: '😴', label: 'Low' },
  { value: 3, emoji: '⚡', label: 'Okay' },
  { value: 4, emoji: '⚡⚡', label: 'Good' },
  { value: 5, emoji: '⚡⚡⚡', label: 'High' },
];

const COMPLETION_OPTIONS: { value: 0 | 50 | 100; label: string }[] = [
  { value: 0, label: 'Not done' },
  { value: 50, label: 'Half done' },
  { value: 100, label: 'Done ✓' },
];

const WOULD_REPEAT: { value: WouldRepeat; label: string }[] = [
  { value: 'YES', label: '🔁 Yes' },
  { value: 'MAYBE', label: '🤔 Maybe' },
  { value: 'NO', label: '🚫 No' },
];

export function LogFormScreen({ route, navigation }: Props) {
  const activityId = route.params?.activityId ?? '';
  const editMode = route.params?.editMode;
  const { user } = useAuthStore();
  const { activities, logs, submitLog } = useActivitiesStore();
  const activity = activities.find((a) => a.id === activityId);
  const existingLog = logs[activityId];

  const [mood, setMood] = useState(existingLog?.mood ?? 0);
  const [energy, setEnergy] = useState(existingLog?.energy ?? 0);
  const [completion, setCompletion] = useState<0 | 50 | 100>(existingLog?.completion_pct as 0 | 50 | 100 ?? 100);
  const [reflection, setReflection] = useState(existingLog?.reflection ?? '');
  const [wouldRepeat, setWouldRepeat] = useState<WouldRepeat | null>(existingLog?.would_repeat ?? null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [freemiumBlocked, setFreemiumBlocked] = useState(false);

  useEffect(() => {
    if (!user || editMode) return;
    countTodayLogs(user.id).then((count) => {
      if (user.subscription_tier !== 'PRO' && count >= FREE_TIER_LOG_LIMIT) {
        setFreemiumBlocked(true);
      }
    });
  }, [user, editMode]);

  if (!activity) return null;

  const endTime = addMinutes(parseISO(activity.start_time), activity.duration_minutes);
  if (!isEditWindowOpen(endTime) && !editMode) {
    return (
      <View style={styles.container}>
        <View style={styles.closedWindow}>
          <Text style={styles.closedEmoji}>🔒</Text>
          <Text style={styles.closedTitle}>Editing window closed</Text>
          <Text style={styles.closedBody}>Logs can be edited up to 24 hours after an activity ends.</Text>
          <TouchableOpacity style={styles.doneButton} onPress={navigation.goBack}>
            <Text style={styles.doneButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (freemiumBlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.closedWindow}>
          <Text style={styles.closedEmoji}>⭐</Text>
          <Text style={styles.closedTitle}>Daily limit reached</Text>
          <Text style={styles.closedBody}>
            Free plan includes {FREE_TIER_LOG_LIMIT} logs per day.{'\n'}
            Upgrade to Pro for unlimited logging.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={navigation.goBack}>
            <Text style={styles.upgradeButtonText}>Upgrade to Pro — $10/mo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={navigation.goBack}>
            <Text style={styles.skipText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function determinPhase(): LogPhase {
    const now = new Date();
    const start = parseISO(activity!.start_time);
    if (now < start) return 'BEFORE';
    if (now <= endTime) return 'DURING';
    return 'AFTER';
  }

  async function handleSubmit() {
    if (!mood || !energy) {
      Alert.alert('Required', 'Please rate your mood and energy.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await submitLog({
        activity_id: activityId,
        user_id: user.id,
        mood, energy,
        completion_pct: completion,
        reflection: reflection.trim() || undefined,
        would_repeat: wouldRepeat ?? undefined,
        log_phase: determinPhase(),
      });
      // Show success animation
      setShowSuccess(true);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => navigation.goBack());
    } catch {
      Alert.alert('Error', 'Failed to save log. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (showSuccess) {
    return (
      <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>Logged ✓</Text>
        <Text style={styles.successBody}>
          {mood >= 4 ? 'Great session!' : mood <= 2 ? 'Thanks for being honest.' : 'Good job logging that.'}
        </Text>
      </Animated.View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.activityTitle}>{activity.title}</Text>

      <Text style={styles.sectionLabel}>MOOD</Text>
      <View style={styles.scaleRow}>
        {MOOD.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.scaleItem, mood === m.value && styles.scaleItemSelected]}
            onPress={() => setMood(m.value)}
            accessibilityLabel={`Mood ${m.label}`}
            accessibilityState={{ selected: mood === m.value }}
          >
            <Text style={styles.scaleEmoji}>{m.emoji}</Text>
            <Text style={[styles.scaleLabel2, mood === m.value && styles.scaleLabelSelected]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>ENERGY</Text>
      <View style={styles.scaleRow}>
        {ENERGY.map((e) => (
          <TouchableOpacity
            key={e.value}
            style={[styles.scaleItem, energy === e.value && styles.scaleItemSelected]}
            onPress={() => setEnergy(e.value)}
            accessibilityLabel={`Energy ${e.label}`}
            accessibilityState={{ selected: energy === e.value }}
          >
            <Text style={styles.scaleEmoji}>{e.emoji}</Text>
            <Text style={[styles.scaleLabel2, energy === e.value && styles.scaleLabelSelected]}>{e.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>COMPLETION</Text>
      <View style={styles.chipRow}>
        {COMPLETION_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, completion === opt.value && styles.chipSelected]}
            onPress={() => setCompletion(opt.value)}
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: completion === opt.value }}
          >
            <Text style={[styles.chipText, completion === opt.value && styles.chipTextSelected]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>WOULD YOU REPEAT? <Text style={styles.optional}>(optional)</Text></Text>
      <View style={styles.chipRow}>
        {WOULD_REPEAT.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, wouldRepeat === opt.value && styles.chipSelected]}
            onPress={() => setWouldRepeat(wouldRepeat === opt.value ? null : opt.value)}
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: wouldRepeat === opt.value }}
          >
            <Text style={[styles.chipText, wouldRepeat === opt.value && styles.chipTextSelected]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>REFLECTION <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput
        style={styles.reflectionInput}
        placeholder="How did it go?"
        placeholderTextColor="#475569"
        value={reflection}
        onChangeText={(t) => setReflection(t.slice(0, 5000))}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        accessibilityLabel="Reflection text"
      />
      <Text style={styles.charCount}>{reflection.length}/5000</Text>

      <TouchableOpacity
        style={[styles.submitButton, (!mood || !energy || saving) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!mood || !energy || saving}
        accessibilityLabel="Save log"
        accessibilityRole="button"
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save Log</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 48 },
  activityTitle: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginBottom: 24, lineHeight: 26 },
  sectionLabel: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginTop: 20 },
  optional: { color: '#334155', fontWeight: '400' },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleItem: {
    alignItems: 'center', flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1E293B', marginHorizontal: 3, minHeight: 64,
  },
  scaleItemSelected: { backgroundColor: '#312E81' },
  scaleEmoji: { fontSize: 24, marginBottom: 4 },
  scaleLabel2: { color: '#64748B', fontSize: 10, fontWeight: '500' },
  scaleLabelSelected: { color: '#A5B4FC' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', minHeight: 44,
  },
  chipSelected: { backgroundColor: '#312E81' },
  chipText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#A5B4FC' },
  reflectionInput: {
    backgroundColor: '#1E293B', borderRadius: 10,
    padding: 14, color: '#F1F5F9', fontSize: 15,
    minHeight: 100,
  },
  charCount: { color: '#334155', fontSize: 11, textAlign: 'right', marginTop: 4 },
  submitButton: {
    backgroundColor: '#6366F1', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 24, minHeight: 44,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  successOverlay: {
    flex: 1, backgroundColor: '#0F172A',
    alignItems: 'center', justifyContent: 'center',
  },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { color: '#F1F5F9', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  successBody: { color: '#64748B', fontSize: 16 },
  closedWindow: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  closedEmoji: { fontSize: 48, marginBottom: 16 },
  closedTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  closedBody: { color: '#64748B', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  doneButton: {
    backgroundColor: '#1E293B', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 32, minHeight: 44,
  },
  doneButtonText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  upgradeButton: {
    backgroundColor: '#6366F1', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 24, minHeight: 44, marginBottom: 12,
  },
  upgradeButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipButton: { minHeight: 44, justifyContent: 'center' },
  skipText: { color: '#475569', fontSize: 14 },
});
