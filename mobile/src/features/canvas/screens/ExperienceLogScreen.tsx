import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { format, parseISO, addMinutes } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { Activity } from '../../../types';
import { colors, spacing, shadows } from '../../../theme';

// --- Route / Nav types ---

interface RouteParams {
  activityId: string;
}

interface Props {
  route: { params: RouteParams };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

// --- Mood / Energy option data ---

const MOOD_OPTIONS = [
  { emoji: '\u{1F61E}', label: 'Bad' },
  { emoji: '\u{1F615}', label: 'Low' },
  { emoji: '\u{1F610}', label: 'Okay' },
  { emoji: '\u{1F642}', label: 'Good' },
  { emoji: '\u{1F60A}', label: 'Great' },
] as const;

const ENERGY_OPTIONS = [
  { emoji: '\u{1FAAB}', label: 'Drained' },
  { emoji: '\u{1F634}', label: 'Low' },
  { emoji: '\u{1F60C}', label: 'Steady' },
  { emoji: '\u26A1', label: 'High' },
  { emoji: '\u{1F525}', label: 'Peak' },
] as const;

const COMPLETION_OPTIONS = [
  { label: 'Skipped', value: 0 as const },
  { label: 'Half done', value: 50 as const },
  { label: 'Completed', value: 100 as const },
];

// --- Helpers ---

function formatTimeRange(startIso: string, durationMinutes: number): string {
  const start = parseISO(startIso);
  const end = addMinutes(start, durationMinutes);
  return `${format(start, 'h:mm a')} \u2013 ${format(end, 'h:mm a')}`;
}

function defaultCompletion(activity: Activity): 0 | 50 | 100 {
  if (activity.status === 'COMPLETED') return 100;
  if (activity.status === 'SKIPPED') return 0;
  return 100; // default for past activities
}

// --- Component ---

export function ExperienceLogScreen({ route, navigation }: Props) {
  const { activityId } = route.params;
  const { user } = useAuthStore();
  const { activities, logs, submitLog } = useActivitiesStore();

  const activity = useMemo(
    () => activities.find((a) => a.id === activityId),
    [activities, activityId],
  );

  const existingLog = logs[activityId];

  // Form state — pre-fill from existing log if available
  const [mood, setMood] = useState<number | null>(existingLog?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(existingLog?.energy ?? null);
  const [completion, setCompletion] = useState<0 | 50 | 100>(
    existingLog?.completion_pct ?? (activity ? defaultCompletion(activity) : 100),
  );
  const [reflection, setReflection] = useState(existingLog?.reflection ?? '');
  const [saving, setSaving] = useState(false);

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Activity not found.</Text>
      </View>
    );
  }

  const categoryIcon = activity.category?.icon ?? '';

  const handleSave = async () => {
    if (!user || !mood || !energy) return;
    setSaving(true);
    try {
      await submitLog({
        activity_id: activityId,
        user_id: user.id,
        mood,
        energy,
        completion_pct: completion,
        reflection: reflection.trim() || undefined,
        log_phase: 'AFTER',
      });
      navigation.goBack();
    } catch {
      setSaving(false);
    }
  };

  const canSave = mood !== null && energy !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Activity header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {categoryIcon ? (
              <Text style={styles.headerIcon}>{categoryIcon}</Text>
            ) : null}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activity.title}
            </Text>
            <Text style={styles.checkmark}>{'\u2713'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('ActivityForm', { activityId })}
            activeOpacity={0.7}
          >
            <Text style={styles.editIcon}>{'\u270F\uFE0F'}</Text>
          </TouchableOpacity>
        </View>

        {/* Time range */}
        {activity.start_time ? (
          <Text style={styles.timeRange}>
            {formatTimeRange(activity.start_time, activity.duration_minutes)}
          </Text>
        ) : null}

        {/* MOOD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MOOD</Text>
          <View style={styles.circleRow}>
            {MOOD_OPTIONS.map((opt, idx) => {
              const value = idx + 1;
              const selected = mood === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={styles.circleContainer}
                  onPress={() => setMood(value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.circle,
                      selected && styles.circleMoodSelected,
                    ]}
                  >
                    <Text style={styles.circleEmoji}>{opt.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.circleLabel,
                      selected && styles.circleLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ENERGY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ENERGY</Text>
          <View style={styles.circleRow}>
            {ENERGY_OPTIONS.map((opt, idx) => {
              const value = idx + 1;
              const selected = energy === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={styles.circleContainer}
                  onPress={() => setEnergy(value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.circle,
                      selected && styles.circleEnergySelected,
                    ]}
                  >
                    <Text style={styles.circleEmoji}>{opt.emoji}</Text>
                  </View>
                  <Text
                    style={[
                      styles.circleLabel,
                      selected && styles.circleLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* COMPLETION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPLETION</Text>
          <View style={styles.chipRow}>
            {COMPLETION_OPTIONS.map((opt) => {
              const selected = completion === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setCompletion(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* REFLECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REFLECTION</Text>
          <TextInput
            style={styles.reflectionInput}
            placeholder="Any thoughts on how it went?"
            placeholderTextColor={colors.muted}
            value={reflection}
            onChangeText={setReflection}
            returnKeyType="done"
          />
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[styles.actionBtn, !canSave && styles.actionBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!canSave || saving}
        >
          <Text style={styles.actionBtnText}>
            {saving ? 'Saving...' : 'Reflect & Close'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---

const CIRCLE_SIZE = 40;
const ACCENT = '#C4795B';
const ACCENT_BG = 'rgba(196,121,91,0.15)';
const PRIMARY = colors.primary;
const PRIMARY_BG = 'rgba(45,74,62,0.12)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.glass.sheet,
  },
  scrollContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },
  errorText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 60,
  },

  // Drag handle
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  editIcon: {
    fontSize: 16,
  },

  // Time range
  timeRange: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
    marginBottom: 8,
  },

  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 10,
  },

  // Circles (mood / energy)
  circleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleContainer: {
    alignItems: 'center',
    width: CIRCLE_SIZE + 16,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circleMoodSelected: {
    backgroundColor: ACCENT_BG,
    borderColor: ACCENT,
  },
  circleEnergySelected: {
    backgroundColor: PRIMARY_BG,
    borderColor: PRIMARY,
  },
  circleEmoji: {
    fontSize: 18,
  },
  circleLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.muted,
    marginTop: 4,
  },
  circleLabelSelected: {
    color: colors.text,
    fontWeight: '600',
  },

  // Completion chips
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Reflection input
  reflectionInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
  },

  // Action button
  actionBtn: {
    marginTop: 28,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExperienceLogScreen;
