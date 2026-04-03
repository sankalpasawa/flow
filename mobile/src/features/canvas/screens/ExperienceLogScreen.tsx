import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated, PanResponder,
  Dimensions,
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
  return 100;
}

const DISMISS_THRESHOLD = 120;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// --- Component ---

export function ExperienceLogScreen({ route, navigation }: Props) {
  const { activityId } = route.params;
  const { user } = useAuthStore();
  const { activities, logs, submitLog } = useActivitiesStore();

  // Match by exact ID or prefix (real ID matches virtual uuid_date)
  const activity = useMemo(
    () => activities.find((a) => a.id === activityId || a.id.split('_')[0] === activityId),
    [activities, activityId],
  );

  // Check logs by both real and virtual ID
  const existingLog = logs[activityId] || (activity ? logs[activity.id] : undefined);

  // Form state
  const [mood, setMood] = useState<number | null>(existingLog?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(existingLog?.energy ?? null);
  const [completion, setCompletion] = useState<0 | 50 | 100>(
    existingLog?.completion_pct ?? (activity ? defaultCompletion(activity) : 100),
  );
  const [reflection, setReflection] = useState(existingLog?.reflection ?? '');
  const [saving, setSaving] = useState(false);

  // Swipe-to-dismiss
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const isAtTop = useRef(true);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only capture downward swipes when scrolled to top
        return isAtTop.current && gesture.dy > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => navigation.goBack());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    }),
  ).current;

  if (!activity) {
    return (
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.errorText}>Activity not found.</Text>
        </View>
      </View>
    );
  }

  const categoryIcon = activity.category?.icon ?? '';

  const handleDone = async () => {
    const canSave = mood !== null && energy !== null && user;
    if (canSave) {
      setSaving(true);
      try {
        await submitLog({
          activity_id: activityId,
          user_id: user!.id,
          mood: mood!,
          energy: energy!,
          completion_pct: completion,
          reflection: reflection.trim() || undefined,
          log_phase: 'AFTER',
        });
      } catch {
        // silent — still dismiss
      }
    }
    navigation.goBack();
  };

  return (
    <View style={styles.overlay}>
      {/* Tap outside to dismiss */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              isAtTop.current = e.nativeEvent.contentOffset.y <= 0;
            }}
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

            {/* Action button — always enabled */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleDone}
              activeOpacity={0.85}
              disabled={saving}
            >
              <Text style={styles.actionBtnText}>
                {saving ? 'Saving...' : 'Reflect & Close'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// --- Styles ---

const CIRCLE_SIZE = 44;
const ACCENT = colors.accent;
const ACCENT_BG = 'rgba(196,121,91,0.15)';
const PRIMARY = colors.primary;
const PRIMARY_BG = 'rgba(45,90,62,0.12)';
const SHEET_BG = colors.bg;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...shadows.card,
  },
  scrollContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 40,
  },
  errorText: {
    color: colors.text2,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
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
    fontSize: 16,
    fontWeight: '700',
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
    color: colors.text2,
    marginTop: 2,
    marginBottom: 8,
  },

  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.text2,
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
    fontSize: 20,
  },
  circleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 4,
  },
  circleLabelSelected: {
    color: colors.text,
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.text2,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Reflection input
  reflectionInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '500',
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
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ExperienceLogScreen;
