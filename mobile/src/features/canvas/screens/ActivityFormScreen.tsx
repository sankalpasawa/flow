import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { format, parseISO, addMinutes } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { getCategories } from '../../../lib/db/categories';
import { Category, ActivityPriority } from '../../../types';
import { SYSTEM_CATEGORIES } from '../../categories/systemCategories';

interface RouteParams {
  activityId?: string;
  startHour?: string; // "HH:00"
  date?: string; // "yyyy-MM-dd"
}

interface Props {
  route: { params?: RouteParams };
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

export function ActivityFormScreen({ route, navigation }: Props) {
  const { activityId, startHour, date } = route.params ?? {};
  const { user } = useAuthStore();
  const { activities, addActivity, editActivity } = useActivitiesStore();
  const existingActivity = activityId ? activities.find((a) => a.id === activityId) : null;

  const [title, setTitle] = useState(existingActivity?.title ?? '');
  const [duration, setDuration] = useState(existingActivity?.duration_minutes ?? 60);
  const [startTime, setStartTime] = useState(() => {
    if (existingActivity) return existingActivity.start_time;
    const d = date ?? format(new Date(), 'yyyy-MM-dd');
    const h = startHour ? parseInt(startHour.split(':')[0]) : new Date().getHours() + 1;
    const dt = new Date(`${d}T${h.toString().padStart(2, '0')}:00:00`);
    return dt.toISOString();
  });
  const [categoryId, setCategoryId] = useState(existingActivity?.category_id ?? SYSTEM_CATEGORIES[0].id);
  const [priority, setPriority] = useState<ActivityPriority>(existingActivity?.priority ?? 'MEDIUM');
  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) getCategories(user.id).then(setCategories).catch((err) => {
      console.error('[DayFlow] Failed to load categories:', err);
    });
  }, [user]);

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
          title: title.trim(), start_time: startTime,
          duration_minutes: duration, category_id: categoryId, priority,
        });
      } else {
        await addActivity({
          user_id: user.id, title: title.trim(),
          start_time: startTime, duration_minutes: duration,
          category_id: categoryId, priority,
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

  function adjustMinute(delta: number) {
    const d = parseISO(startTime);
    d.setMinutes(Math.round(d.getMinutes() / 15) * 15 + delta);
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <View style={styles.catRow}>
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

        <Text style={styles.sectionLabel}>PRIORITY</Text>
        <View style={styles.priorityRow}>
          {(['HIGH', 'MEDIUM', 'LOW'] as ActivityPriority[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityChip, priority === p && styles.priorityChipSelected]}
              onPress={() => setPriority(p)}
              accessibilityLabel={`${p} priority`}
              accessibilityState={{ selected: priority === p }}
            >
              <Text style={[styles.priorityText, priority === p && styles.priorityTextSelected]}>{p}</Text>
            </TouchableOpacity>
          ))}
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  titleInput: {
    backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 14, color: '#F1F5F9', fontSize: 17, minHeight: 44,
  },
  charCount: { color: '#334155', fontSize: 11, textAlign: 'right', marginTop: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1E293B', borderRadius: 10, padding: 8,
  },
  timeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  timeBtnText: { color: '#6366F1', fontSize: 22, fontWeight: '700' },
  timeValue: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', minWidth: 56, textAlign: 'center' },
  timeSep: { color: '#475569', fontSize: 16 },
  endTime: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationChip: {
    backgroundColor: '#1E293B', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center',
  },
  durationChipSelected: { backgroundColor: '#312E81' },
  durationText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  durationTextSelected: { color: '#A5B4FC' },
  catScroll: { marginHorizontal: -20 },
  catRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1E293B', borderRadius: 20, borderWidth: 1, borderColor: '#1E293B',
    paddingVertical: 8, paddingHorizontal: 12, minHeight: 44,
  },
  catIcon: { fontSize: 16 },
  catName: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center', minHeight: 44,
  },
  priorityChipSelected: { backgroundColor: '#312E81' },
  priorityText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  priorityTextSelected: { color: '#A5B4FC' },
  saveButton: {
    backgroundColor: '#6366F1', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 32, minHeight: 44,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
