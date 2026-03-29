import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { useGoalsStore } from '../../../store/goalsStore';
import { getCategories } from '../../../lib/db/categories';
import { Category, GoalMetricType, GoalFrequency } from '../../../types';
import { SYSTEM_CATEGORIES } from '../../categories/systemCategories';
import { colors, radii, spacing } from '../../../theme';

interface Props {
  navigation: { goBack: () => void };
  route: { params: { goalId: string } };
}

const TIME_TARGET_OPTIONS = [15, 30, 60, 90, 120, 180, 240];
const SESSION_TARGET_OPTIONS = [1, 2, 3, 5, 7, 10];

export function GoalEditScreen({ navigation, route }: Props) {
  const { goalId } = route.params;
  const { user } = useAuthStore();
  const { goals, updateGoal, deleteGoal } = useGoalsStore();

  const goal = goals.find((g) => g.id === goalId);

  const [title, setTitle] = useState(goal?.title ?? '');
  const [metricType, setMetricType] = useState<GoalMetricType>(goal?.metric_type ?? 'TIME');
  const [targetValue, setTargetValue] = useState(goal?.target_value ?? 60);
  const [frequency, setFrequency] = useState<GoalFrequency>(goal?.frequency ?? 'DAILY');
  const [categoryId, setCategoryId] = useState(goal?.category_id ?? SYSTEM_CATEGORIES[0].id);
  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getCategories(user.id).then(setCategories).catch((err) => {
        console.error('[DayFlow] Failed to load categories:', err);
      });
    }
  }, [user]);

  const targetOptions = metricType === 'TIME' ? TIME_TARGET_OPTIONS : SESSION_TARGET_OPTIONS;

  function formatTarget(value: number): string {
    if (metricType === 'SESSIONS') {
      return value === 1 ? '1 session' : `${value} sessions`;
    }
    if (value < 60) return `${value}m`;
    return value % 60 === 0 ? `${value / 60}h` : `${Math.floor(value / 60)}h ${value % 60}m`;
  }

  async function handleSave() {
    if (!title.trim()) {
      setErrorMessage('Please add a title for this goal.');
      return;
    }
    setErrorMessage(null);
    if (!user) return;
    setSaving(true);
    try {
      await updateGoal(goalId, {
        title: title.trim(),
        metric_type: metricType,
        target_value: targetValue,
        frequency,
        category_id: categoryId,
      });
      navigation.goBack();
    } catch (err) {
      console.error('[DayFlow] Failed to update goal:', err);
      setErrorMessage('Failed to update goal. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteGoal(goalId);
      navigation.goBack();
    } catch (err) {
      console.error('[DayFlow] Failed to delete goal:', err);
      setErrorMessage('Failed to delete goal. Please try again.');
      setDeleting(false);
    }
  }

  if (!goal) {
    return (
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => navigation.goBack()} />
        <View style={styles.sheet}>
          <View style={styles.handleBar}><View style={styles.handle} /></View>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit Goal</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.sheetClose}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.muted, textAlign: 'center', padding: 40 }}>Goal not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Drag handle */}
        <View style={styles.handleBar}>
          <View style={styles.handle} />
        </View>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Edit Goal</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.sheetClose}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>GOAL</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="What do you want to achieve?"
            placeholderTextColor="#475569"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            accessibilityLabel="Goal title"
          />
          <Text style={styles.charCount}>{title.length}/80</Text>

          <Text style={styles.sectionLabel}>METRIC TYPE</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleChip, metricType === 'TIME' && styles.toggleChipSelected]}
              onPress={() => setMetricType('TIME')}
            >
              <Text style={[styles.toggleText, metricType === 'TIME' && styles.toggleTextSelected]}>Time</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleChip, metricType === 'SESSIONS' && styles.toggleChipSelected]}
              onPress={() => setMetricType('SESSIONS')}
            >
              <Text style={[styles.toggleText, metricType === 'SESSIONS' && styles.toggleTextSelected]}>Sessions</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>TARGET</Text>
          <View style={styles.chipGrid}>
            {targetOptions.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.targetChip, targetValue === val && styles.targetChipSelected]}
                onPress={() => setTargetValue(val)}
                accessibilityLabel={formatTarget(val)}
                accessibilityState={{ selected: targetValue === val }}
              >
                <Text style={[styles.targetText, targetValue === val && styles.targetTextSelected]}>
                  {formatTarget(val)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>FREQUENCY</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleChip, frequency === 'DAILY' && styles.toggleChipSelected]}
              onPress={() => setFrequency('DAILY')}
            >
              <Text style={[styles.toggleText, frequency === 'DAILY' && styles.toggleTextSelected]}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleChip, frequency === 'WEEKLY' && styles.toggleChipSelected]}
              onPress={() => setFrequency('WEEKLY')}
            >
              <Text style={[styles.toggleText, frequency === 'WEEKLY' && styles.toggleTextSelected]}>Weekly</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            <View style={styles.hRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, categoryId === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color }]}
                  onPress={() => setCategoryId(cat.id)}
                  accessibilityLabel={cat.name}
                  accessibilityState={{ selected: categoryId === cat.id }}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catName, categoryId === cat.id && { color: cat.color }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {errorMessage && (
            <Text style={{ color: '#FCA5A5', fontSize: 14, textAlign: 'center', marginTop: 12 }}>{errorMessage}</Text>
          )}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || deleting}
            accessibilityLabel="Save goal"
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={saving || deleting}
            accessibilityLabel="Delete goal"
            accessibilityRole="button"
          >
            {deleting ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Goal</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  overlayDismiss: { height: 60 },
  sheet: {
    flex: 1, backgroundColor: colors.bg,
    borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet,
  },
  handleBar: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingBottom: 8,
  },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  sheetClose: { color: colors.muted, fontSize: 20, fontWeight: '400' },
  content: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, marginBottom: 8, marginTop: 20, textTransform: 'uppercase' },
  titleInput: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 14, color: colors.text, fontSize: 15, minHeight: 44,
  },
  charCount: { color: colors.muted, fontSize: 11, textAlign: 'right', marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleChip: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.md,
    paddingVertical: 12, alignItems: 'center', minHeight: 44,
    borderWidth: 1.5, borderColor: colors.border,
  },
  toggleChipSelected: { backgroundColor: colors.primaryBg, borderColor: colors.primary },
  toggleText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  toggleTextSelected: { color: colors.primary },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  targetChip: {
    backgroundColor: colors.surface, borderRadius: radii.pill,
    paddingVertical: 8, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  targetChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  targetText: { color: colors.text2, fontSize: 12, fontWeight: '600' },
  targetTextSelected: { color: '#fff' },
  hScroll: { marginHorizontal: -20 },
  hRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: 8, paddingHorizontal: 12, minHeight: 44,
  },
  catIcon: { fontSize: 16 },
  catName: { color: colors.text2, fontSize: 13, fontWeight: '500' },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: radii.button,
    paddingVertical: 16, alignItems: 'center', marginTop: 32, minHeight: 44,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  deleteButton: {
    paddingVertical: 16, alignItems: 'center', marginTop: 12, minHeight: 44,
  },
  deleteButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
