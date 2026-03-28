import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { format, parseISO, addMinutes } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { getCategories } from '../../../lib/db/categories';
import { Category, RecurrenceType, Weekday, Subtask } from '../../../types';
import { SYSTEM_CATEGORIES } from '../../categories/systemCategories';
import { generateId } from '../../../lib/db/db';
import { colors, radii } from '../../../theme';

interface RouteParams {
  activityId?: string;
  startHour?: string;
  date?: string;
  backlog?: boolean; // true = creating unscheduled task
}

interface Props {
  route: { params?: RouteParams };
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; icon: string }[] = [
  { value: 'NONE', label: 'Once', icon: '1️⃣' },
  { value: 'DAILY', label: 'Daily', icon: '📅' },
  { value: 'WEEKDAYS', label: 'Weekdays', icon: '💼' },
  { value: 'WEEKLY', label: 'Weekly', icon: '🔄' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks', icon: '🔄' },
  { value: 'TRIWEEKLY', label: 'Every 3 weeks', icon: '🔄' },
  { value: 'MONTHLY', label: 'Monthly', icon: '📆' },
  { value: 'BIMONTHLY', label: 'Every 2 months', icon: '📆' },
  { value: 'QUARTERLY', label: 'Every 3 months', icon: '📆' },
  { value: 'BIANNUAL', label: 'Every 6 months', icon: '📆' },
  { value: 'YEARLY', label: 'Yearly', icon: '🗓️' },
];

const ALL_WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ActivityFormScreen({ route, navigation }: Props) {
  const { activityId, startHour, date, backlog } = route.params ?? {};
  const { user } = useAuthStore();
  const { activities, addActivity, editActivity } = useActivitiesStore();
  const existingActivity = activityId ? activities.find((a) => a.id === activityId) : null;

  const [title, setTitle] = useState(existingActivity?.title ?? '');
  const [description, setDescription] = useState(existingActivity?.description ?? '');
  const [duration, setDuration] = useState(existingActivity?.duration_minutes ?? 15);
  const [isScheduled, setIsScheduled] = useState(
    existingActivity ? existingActivity.is_scheduled : !backlog
  );
  const [startTime, setStartTime] = useState(() => {
    if (existingActivity) return existingActivity.start_time;
    const d = date ?? format(new Date(), 'yyyy-MM-dd');
    const h = startHour ? parseInt(startHour.split(':')[0]) : new Date().getHours() + 1;
    const dt = new Date(`${d}T${h.toString().padStart(2, '0')}:00:00`);
    return dt.toISOString();
  });
  const [categoryId, setCategoryId] = useState(existingActivity?.category_id ?? SYSTEM_CATEGORIES[0].id);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(existingActivity?.recurrence_type ?? 'NONE');
  const [recurrenceDays, setRecurrenceDays] = useState<Weekday[]>(existingActivity?.recurrence_days ?? []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(existingActivity?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) getCategories(user.id).then(setCategories).catch((err) => {
      console.error('[DayFlow] Failed to load categories:', err);
    });
  }, [user]);

  const showDayPicker = recurrence === 'WEEKLY' || recurrence === 'BIWEEKLY' || recurrence === 'TRIWEEKLY';

  function toggleDay(day: Weekday) {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [...prev, { id: generateId(), title: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  }

  function removeSubtask(id: string) {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  }

  function toggleSubtask(id: string) {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
  }

  async function handleSave() {
    if (!title.trim()) {
      setErrorMessage('Please add a title for this activity.');
      return;
    }
    setErrorMessage(null);
    if (!user) return;
    setSaving(true);
    try {
      if (existingActivity) {
        await editActivity(existingActivity.id, {
          title: title.trim(), description: description.trim() || null,
          start_time: startTime, duration_minutes: duration,
          category_id: categoryId, is_scheduled: isScheduled,
          recurrence_type: recurrence, recurrence_days: recurrenceDays,
          subtasks,
        });
      } else {
        await addActivity({
          user_id: user.id, title: title.trim(),
          description: description.trim() || undefined,
          start_time: startTime, duration_minutes: duration,
          category_id: categoryId, is_scheduled: isScheduled,
          recurrence_type: recurrence, recurrence_days: recurrenceDays,
          subtasks: subtasks.length > 0 ? subtasks : undefined,
        });
      }
      navigation.goBack();
    } catch (err) {
      console.error('[DayFlow] Failed to save activity:', err);
      setErrorMessage('Failed to save activity. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function adjustHour(delta: number) {
    const d = parseISO(startTime);
    d.setHours(d.getHours() + delta);
    setStartTime(d.toISOString());
  }

  const startDt = parseISO(startTime);
  const endDt = addMinutes(startDt, duration);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>ACTIVITY</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="What are you planning?"
          placeholderTextColor="#475569"
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          autoFocus={!existingActivity}
          accessibilityLabel="Activity title"
        />
        <Text style={styles.charCount}>{title.length}/80</Text>

        <Text style={styles.sectionLabel}>NOTES</Text>
        <TextInput
          style={[styles.titleInput, styles.descriptionInput]}
          placeholder="Add details or notes..."
          placeholderTextColor="#475569"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
          accessibilityLabel="Activity notes"
        />

        {/* Scheduled toggle */}
        <Text style={styles.sectionLabel}>SCHEDULING</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleChip, isScheduled && styles.toggleChipSelected]}
            onPress={() => setIsScheduled(true)}
          >
            <Text style={[styles.toggleText, isScheduled && styles.toggleTextSelected]}>📅 Scheduled</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, !isScheduled && styles.toggleChipSelected]}
            onPress={() => setIsScheduled(false)}
          >
            <Text style={[styles.toggleText, !isScheduled && styles.toggleTextSelected]}>📋 Someday</Text>
          </TouchableOpacity>
        </View>

        {isScheduled && (
          <>
            <Text style={styles.sectionLabel}>TIME</Text>
            <View style={styles.timeRow}>
              <View style={styles.timePicker}>
                <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.timeBtn} accessibilityLabel="Decrease hour">
                  <Text style={styles.timeBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.timeValue}>{format(startDt, 'HH:mm')}</Text>
                <TouchableOpacity onPress={() => adjustHour(1)} style={styles.timeBtn} accessibilityLabel="Increase hour">
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.timeSep}>→</Text>
              <Text style={styles.endTime}>{format(endDt, 'HH:mm')}</Text>
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>DURATION</Text>
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationChip, duration === d && styles.durationChipSelected]}
              onPress={() => setDuration(d)}
              accessibilityLabel={`${d} minutes`}
              accessibilityState={{ selected: duration === d }}
            >
              <Text style={[styles.durationText, duration === d && styles.durationTextSelected]}>
                {d < 60 ? `${d}m` : `${d / 60}h`}
              </Text>
            </TouchableOpacity>
          ))}
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

        <Text style={styles.sectionLabel}>FREQUENCY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
          <View style={styles.hRow}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.recurrenceChip, recurrence === opt.value && styles.recurrenceChipSelected]}
                onPress={() => setRecurrence(opt.value)}
                accessibilityLabel={`${opt.label} frequency`}
                accessibilityState={{ selected: recurrence === opt.value }}
              >
                <Text style={styles.recurrenceIcon}>{opt.icon}</Text>
                <Text style={[styles.recurrenceText, recurrence === opt.value && styles.recurrenceTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Day picker for weekly recurrences */}
        {showDayPicker && (
          <>
            <Text style={styles.sectionLabel}>REPEAT ON</Text>
            <View style={styles.dayPickerRow}>
              {ALL_WEEKDAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, recurrenceDays.includes(day) && styles.dayChipSelected]}
                  onPress={() => toggleDay(day)}
                  accessibilityLabel={day}
                  accessibilityState={{ selected: recurrenceDays.includes(day) }}
                >
                  <Text style={[styles.dayText, recurrenceDays.includes(day) && styles.dayTextSelected]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Subtasks */}
        <Text style={styles.sectionLabel}>SUBTASKS</Text>
        {subtasks.map((st) => (
          <View key={st.id} style={styles.subtaskItem}>
            <TouchableOpacity
              style={[styles.subtaskCheckbox, st.done && styles.subtaskCheckboxDone]}
              onPress={() => toggleSubtask(st.id)}
            >
              {st.done && <Text style={styles.subtaskCheckmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={[styles.subtaskTitle, st.done && styles.subtaskTitleDone]}>{st.title}</Text>
            <TouchableOpacity onPress={() => removeSubtask(st.id)} style={styles.subtaskRemove}>
              <Text style={styles.subtaskRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.subtaskAddRow}>
          <TextInput
            style={styles.subtaskInput}
            placeholder="Add a subtask..."
            placeholderTextColor="#475569"
            value={newSubtask}
            onChangeText={setNewSubtask}
            onSubmitEditing={addSubtask}
            returnKeyType="done"
            maxLength={80}
          />
          {newSubtask.trim() ? (
            <TouchableOpacity style={styles.subtaskAddBtn} onPress={addSubtask}>
              <Text style={styles.subtaskAddBtnText}>+</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {errorMessage && (
          <Text style={{ color: '#FCA5A5', fontSize: 14, textAlign: 'center', marginTop: 12 }}>{errorMessage}</Text>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityLabel={existingActivity ? 'Save changes' : 'Create activity'}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{existingActivity ? 'Save Changes' : 'Create Activity'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, marginBottom: 8, marginTop: 20, textTransform: 'uppercase' },
  titleInput: {
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 14, color: colors.text, fontSize: 15, minHeight: 44,
  },
  descriptionInput: { fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
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
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, padding: 8,
  },
  timeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  timeBtnText: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  timeValue: { color: colors.text, fontSize: 20, fontWeight: '700', minWidth: 56, textAlign: 'center' },
  timeSep: { color: colors.muted, fontSize: 16 },
  endTime: { color: colors.text2, fontSize: 16, fontWeight: '600' },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationChip: {
    backgroundColor: colors.surface, borderRadius: radii.pill,
    paddingVertical: 8, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  durationChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationText: { color: colors.text2, fontSize: 12, fontWeight: '600' },
  durationTextSelected: { color: '#fff' },
  hScroll: { marginHorizontal: -20 },
  hRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: 8, paddingHorizontal: 12, minHeight: 44,
  },
  catIcon: { fontSize: 16 },
  catName: { color: colors.text2, fontSize: 13, fontWeight: '500' },
  recurrenceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: 8, paddingHorizontal: 14, minHeight: 44,
  },
  recurrenceChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  recurrenceIcon: { fontSize: 14 },
  recurrenceText: { color: colors.text2, fontSize: 13, fontWeight: '600' },
  recurrenceTextSelected: { color: '#fff' },
  dayPickerRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  dayChip: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.sm,
    paddingVertical: 10, alignItems: 'center', minHeight: 40,
    borderWidth: 1.5, borderColor: colors.border,
  },
  dayChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { color: colors.text2, fontSize: 12, fontWeight: '600' },
  dayTextSelected: { color: '#fff' },
  subtaskItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border,
    padding: 10, marginBottom: 4,
  },
  subtaskCheckbox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  subtaskCheckboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  subtaskCheckmark: { color: '#fff', fontSize: 10, fontWeight: '800' },
  subtaskTitle: { flex: 1, color: colors.text, fontSize: 14 },
  subtaskTitleDone: { textDecorationLine: 'line-through', color: colors.muted },
  subtaskRemove: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  subtaskRemoveText: { color: colors.muted, fontSize: 14 },
  subtaskAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtaskInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, minHeight: 40,
  },
  subtaskAddBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  subtaskAddBtnText: { color: '#fff', fontSize: 18 },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: radii.button,
    paddingVertical: 16, alignItems: 'center', marginTop: 32, minHeight: 44,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
});
