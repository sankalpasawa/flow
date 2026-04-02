import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { format } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { getCategories } from '../../../lib/db/categories';
import { parseActivityText, ParsedActivity } from '../../../lib/parseActivity';
import { SYSTEM_CATEGORIES } from '../../categories/systemCategories';
import { Category } from '../../../types';
import { colors, spacing, radii, motion } from '../../../theme';
import { getCategoryColor } from '../../../theme';

interface RouteParams {
  date?: string;
  startHour?: string;
}

interface Props {
  route: { params?: RouteParams };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

// ─── Chip component ──────────────────────────────────────────────

function Chip({ label, tint, bold }: { label: string; tint?: string; bold?: boolean }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      stiffness: motion.spring.stiffness,
      damping: motion.spring.damping,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.chip,
        tint ? { backgroundColor: tint + '18' } : null,
        { transform: [{ scale }] },
      ]}
    >
      <Text style={[styles.chipText, bold && styles.chipTextBold]}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour12} ${ampm}` : `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

// ─── Main component ─────────────────────────────────────────────

export function QuickAddScreen({ route, navigation }: Props) {
  const { date: paramDate, startHour } = route.params ?? {};
  const { user } = useAuthStore();
  const { addActivity, addTask } = useActivitiesStore();

  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedActivity | null>(null);
  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateStr = paramDate ?? format(new Date(), 'yyyy-MM-dd');

  // Load categories
  useEffect(() => {
    if (!user) return;
    getCategories(user.id).then((cats) => {
      if (cats.length > 0) setCategories(cats);
    }).catch(() => {});
  }, [user]);

  // Auto-focus
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Debounced parsing
  const handleTextChange = useCallback((value: string) => {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setParsed(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const result = parseActivityText(
        value,
        categories.map((c) => ({ id: c.id, name: c.name })),
        new Date(),
      );
      setParsed(result);
    }, 600);
  }, [categories]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // Resolve category name/color for chips
  const getCategoryInfo = useCallback((catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return null;
    const colorPair = getCategoryColor(catId);
    return { name: cat.name, color: colorPair.solid };
  }, [categories]);

  // Create handler
  const handleCreate = useCallback(async () => {
    if (!parsed || !user || saving) return;
    setSaving(true);

    try {
      const activityDate = parsed.date ?? dateStr;

      if (parsed.time) {
        // TIME_BLOCK — has a time set
        await addActivity({
          user_id: user.id,
          title: parsed.title,
          start_time: `${activityDate}T${parsed.time}:00`,
          duration_minutes: parsed.duration ?? 30,
          category_id: parsed.categoryId ?? '',
          activity_type: 'TIME_BLOCK',
          recurrence_type: parsed.recurrence ?? 'NONE',
        });
      } else {
        // TASK — no time set
        await addTask({
          user_id: user.id,
          title: parsed.title,
          category_id: parsed.categoryId ?? undefined,
          assigned_date: activityDate,
        });
      }

      navigation.goBack();
    } catch (err) {
      console.error('[QuickAdd] Failed to create:', err);
    } finally {
      setSaving(false);
    }
  }, [parsed, user, saving, dateStr, addActivity, addTask, navigation]);

  // Navigate to full form, carrying parsed fields
  const goToForm = useCallback(() => {
    navigation.navigate('ActivityForm', {
      date: dateStr,
      startHour,
    });
  }, [navigation, dateStr, startHour]);

  const hasChips = parsed && parsed.title.trim().length > 0;
  const catInfo = parsed?.categoryId ? getCategoryInfo(parsed.categoryId) : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="What do you want to do?"
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={handleTextChange}
          multiline={false}
          returnKeyType="done"
          autoCorrect={false}
        />

        {/* "or fill form manually" link */}
        <TouchableOpacity onPress={goToForm} activeOpacity={0.6}>
          <Text style={styles.formLink}>or fill form manually</Text>
        </TouchableOpacity>

        {/* Parsed chips */}
        {hasChips && (
          <View style={styles.chipsRow}>
            <Chip label={parsed.title} bold />
            {parsed.time && <Chip label={formatTime(parsed.time)} />}
            {parsed.duration && <Chip label={`${parsed.duration}m`} />}
            {catInfo && <Chip label={catInfo.name} tint={catInfo.color} />}
            {parsed.recurrence && parsed.recurrence !== 'NONE' && (
              <Chip label={RECURRENCE_LABELS[parsed.recurrence] ?? parsed.recurrence} />
            )}
          </View>
        )}

        {/* Create button */}
        {hasChips && (
          <TouchableOpacity
            style={[styles.createBtn, saving && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.createBtnText}>
              {saving ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  textInput: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.text,
    paddingVertical: 8,
    marginBottom: 8,
  },
  formLink: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    marginTop: 4,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  chipTextBold: {
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: '#2D5A3E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
