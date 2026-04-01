import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Alert, Switch,
} from 'react-native';
import { format, parseISO, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { getCategories } from '../../../lib/db/categories';
import { Category, RecurrenceType, Weekday, Subtask } from '../../../types';
import { SYSTEM_CATEGORIES } from '../../categories/systemCategories';
import { generateId } from '../../../lib/db/db';
import { colors, radii, spacing } from '../../../theme';

interface RouteParams {
  activityId?: string;
  startHour?: string;
  date?: string;
  backlog?: boolean;
}

interface Props {
  route: { params?: RouteParams };
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
}

const DURATION_OPTIONS: { label: string; value: number }[] = [
  { label: '\u2014', value: 0 },
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
];

const REPEAT_LABELS: Record<string, string> = {
  NONE: 'Once',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

const REPEAT_OPTIONS: RecurrenceType[] = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

// Day-of-week circles for Weekly recurrence (Sun first for US convention)
const DOW_LABELS: { letter: string; day: Weekday }[] = [
  { letter: 'S', day: 'Sun' },
  { letter: 'M', day: 'Mon' },
  { letter: 'T', day: 'Tue' },
  { letter: 'W', day: 'Wed' },
  { letter: 'T', day: 'Thu' },
  { letter: 'F', day: 'Fri' },
  { letter: 'S', day: 'Sat' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => i * 5);

export function ActivityFormScreen({ route, navigation }: Props) {
  const { activityId, startHour, date, backlog } = route.params ?? {};
  const { user } = useAuthStore();
  const {
    activities, untimedTasks, backlog: storeBacklog,
    planActivities, planTasks, carryForward,
    addActivity, addTask, editActivity, removeActivity,
  } = useActivitiesStore();

  const existingActivity = activityId
    ? (activities.find(a => a.id === activityId)
      || untimedTasks.find(a => a.id === activityId)
      || storeBacklog.find(a => a.id === activityId)
      || planActivities.find(a => a.id === activityId)
      || planTasks.find(a => a.id === activityId)
      || carryForward.find(a => a.id === activityId)
      || null)
    : null;

  const isEdit = !!existingActivity;

  // --- State ---
  const [title, setTitle] = useState(existingActivity?.title ?? '');
  const [description, setDescription] = useState(existingActivity?.description ?? '');
  const [mindset, setMindset] = useState(existingActivity?.mindset_prompt ?? '');

  // Date
  const initialDate = (() => {
    if (existingActivity?.start_time) return existingActivity.start_time.substring(0, 10);
    return date ?? format(new Date(), 'yyyy-MM-dd');
  })();
  const [selectedDateStr, setSelectedDateStr] = useState(initialDate);

  // Time — null means unset (task mode)
  const initialHasTime = existingActivity
    ? existingActivity.activity_type === 'TIME_BLOCK'
    : !!startHour && !backlog;
  const initialHour = (() => {
    if (existingActivity?.start_time && initialHasTime) return parseISO(existingActivity.start_time).getHours();
    return startHour ? parseInt(startHour.split(':')[0]) : new Date().getHours() + 1;
  })();
  const initialMinute = (() => {
    if (existingActivity?.start_time && initialHasTime) return parseISO(existingActivity.start_time).getMinutes();
    return startHour && startHour.includes(':') ? parseInt(startHour.split(':')[1]) : 0;
  })();

  const [hasTime, setHasTime] = useState(initialHasTime);
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  // Duration
  const [duration, setDuration] = useState(existingActivity?.duration_minutes ?? (backlog ? 0 : 0));

  // Category — not mandatory, empty string = none
  const [categoryId, setCategoryId] = useState(existingActivity?.category_id ?? '');

  // Recurrence
  const [recurrence, setRecurrence] = useState<RecurrenceType>(existingActivity?.recurrence_type ?? 'NONE');
  const [recurrenceDays, setRecurrenceDays] = useState<Weekday[]>(existingActivity?.recurrence_days ?? []);
  const [neverEnds, setNeverEnds] = useState(true);
  const [showRepeatExpanded, setShowRepeatExpanded] = useState(false);

  // Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>(existingActivity?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');

  // Categories
  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);

  // UI state
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => parseISO(initialDate + 'T00:00:00'));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState(selectedHour);
  const [tempMinute, setTempMinute] = useState(selectedMinute);

  useEffect(() => {
    if (user) getCategories(user.id).then(dbCats => {
      // Merge: system categories first, then any custom DB categories not already in the list
      const systemIds = new Set(SYSTEM_CATEGORIES.map(c => c.id));
      const customCats = dbCats.filter(c => !systemIds.has(c.id));
      setCategories([...SYSTEM_CATEGORIES, ...customCats]);
    }).catch(console.error);
  }, [user]);

  // --- Helpers ---
  const dateLabel = (() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    if (selectedDateStr === todayStr) return 'Today';
    if (selectedDateStr === tomorrowStr) return 'Tomorrow';
    return format(parseISO(selectedDateStr + 'T00:00:00'), 'EEE, MMM d');
  })();

  const timeLabel = hasTime
    ? format(new Date(2000, 0, 1, selectedHour, selectedMinute), 'h:mm a')
    : null;

  const isTask = !hasTime || duration === 0;

  function toggleDay(day: Weekday) {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function addSubtaskItem() {
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

  function pickDate(dateStr: string) {
    setSelectedDateStr(dateStr);
  }

  function openTimePicker() {
    setTempHour(selectedHour);
    setTempMinute(selectedMinute);
    setShowTimePicker(true);
  }

  function confirmTimePick() {
    setSelectedHour(tempHour);
    setSelectedMinute(tempMinute);
    setHasTime(true);
    setShowTimePicker(false);
  }

  // Build start_time ISO string
  function buildStartTime(): string {
    const dt = new Date(
      `${selectedDateStr}T${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}:00`
    );
    return dt.toISOString();
  }

  async function handleSave() {
    if (!title.trim()) {
      setErrorMessage('Please add a title.');
      return;
    }
    setErrorMessage(null);
    if (!user) return;
    setSaving(true);

    try {
      const activityType = isTask ? 'TASK' : 'TIME_BLOCK';

      if (existingActivity) {
        await editActivity(existingActivity.id, {
          title: title.trim(),
          description: description.trim() || null,
          start_time: hasTime ? buildStartTime() : (existingActivity.start_time ?? undefined),
          duration_minutes: duration,
          category_id: categoryId || existingActivity.category_id,
          is_scheduled: hasTime,
          assigned_date: hasTime ? selectedDateStr : (existingActivity.assigned_date ?? selectedDateStr),
          recurrence_type: recurrence,
          recurrence_days: recurrenceDays,
          subtasks,
          mindset_prompt: mindset.trim() || undefined,
        });
      } else if (activityType === 'TASK' && !hasTime) {
        // Save as task
        await addTask({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || undefined,
          category_id: categoryId || SYSTEM_CATEGORIES[0].id,
          assigned_date: selectedDateStr,
          subtasks: subtasks.length > 0 ? subtasks : undefined,
        });
      } else {
        // Save as activity (time block)
        await addActivity({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || undefined,
          start_time: buildStartTime(),
          duration_minutes: duration,
          category_id: categoryId || SYSTEM_CATEGORIES[0].id,
          is_scheduled: true,
          recurrence_type: recurrence,
          recurrence_days: recurrenceDays,
          subtasks: subtasks.length > 0 ? subtasks : undefined,
        });
      }
      navigation.goBack();
    } catch (err) {
      console.error('[DayFlow] Failed to save:', err);
      setErrorMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!existingActivity) return;
    const doDelete = () => {
      removeActivity(existingActivity.id);
      navigation.goBack();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this activity? This cannot be undone.')) doDelete();
    } else {
      Alert.alert('Delete Activity', 'Delete this activity? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  // Calendar grid
  const calendarDays = (() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  })();

  const doneCount = subtasks.filter(s => s.done).length;

  return (
    <View style={s.overlay}>
      <TouchableOpacity style={s.overlayDismiss} activeOpacity={1} onPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={s.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Drag handle */}
        <View style={s.handleBar}>
          <View style={s.handle} />
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Title */}
          <TextInput
            style={s.titleInput}
            placeholder="What you want to do?"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            autoFocus={!isEdit}
          />

          {/* 2. Date + Time row */}
          <View style={s.chipRow}>
            <TouchableOpacity
              style={s.chip}
              onPress={() => { setCalendarMonth(parseISO(selectedDateStr + 'T00:00:00')); setShowCalendar(true); }}
              activeOpacity={0.7}
            >
              <Text style={s.chipText}>{dateLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.chip, hasTime && s.chipSelected]}
              onPress={openTimePicker}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, hasTime && s.chipTextSelected]}>
                {timeLabel ?? '\uD83D\uDD50'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3. Duration row */}
          <View style={s.chipRow}>
            {DURATION_OPTIONS.map(opt => {
              const isSelected = duration === opt.value;
              const isDash = opt.value === 0;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.chipSmall, isSelected && (isDash ? s.chipMuted : s.chipSelected)]}
                  onPress={() => setDuration(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipSmallText, isSelected && (isDash ? s.chipTextMuted : s.chipTextSelected)]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 4. Repeat */}
          <View style={s.section}>
            <TouchableOpacity
              style={[s.chip, showRepeatExpanded && s.chipSelected]}
              onPress={() => setShowRepeatExpanded(prev => !prev)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, showRepeatExpanded && s.chipTextSelected]}>
                {REPEAT_LABELS[recurrence] ?? 'Once'} {'\u25BE'}
              </Text>
            </TouchableOpacity>

            {showRepeatExpanded && (
              <View style={s.repeatPanel}>
                <View style={s.chipRow}>
                  {REPEAT_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[s.chipSmall, recurrence === opt && s.chipSelected]}
                      onPress={() => {
                        setRecurrence(opt);
                        if (opt !== 'WEEKLY') setRecurrenceDays([]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.chipSmallText, recurrence === opt && s.chipTextSelected]}>
                        {REPEAT_LABELS[opt]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Weekly day-of-week circles */}
                {recurrence === 'WEEKLY' && (
                  <View style={s.dowRow}>
                    {DOW_LABELS.map((d, i) => (
                      <TouchableOpacity
                        key={`${d.day}-${i}`}
                        style={[s.dowCircle, recurrenceDays.includes(d.day) && s.dowCircleSelected]}
                        onPress={() => toggleDay(d.day)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.dowText, recurrenceDays.includes(d.day) && s.dowTextSelected]}>
                          {d.letter}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Never ends toggle */}
                <View style={s.neverEndsRow}>
                  <Text style={s.neverEndsLabel}>Never ends</Text>
                  <Switch
                    value={neverEnds}
                    onValueChange={setNeverEnds}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            )}
          </View>

          {/* 5. Mindset */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>MINDSET</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.lineInput}
                placeholder="Set an intention..."
                placeholderTextColor={colors.muted}
                value={mindset}
                onChangeText={setMindset}
                maxLength={200}
              />
              <TouchableOpacity style={s.sparkleBtn} activeOpacity={0.6}>
                <Text style={s.sparkleText}>{'\u2728'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 6. Notes */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>NOTES</Text>
            <TextInput
              style={s.lineInput}
              placeholder="Add details..."
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
            />
          </View>

          {/* 7. Category */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>CATEGORY</Text>
            <View style={s.categoryChipWrap}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.categoryChip, categoryId === cat.id && s.categoryChipSelected]}
                  onPress={() => setCategoryId(prev => prev === cat.id ? '' : cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={s.categoryChipEmoji}>{cat.icon}</Text>
                  <Text style={[
                    s.categoryChipName,
                    categoryId === cat.id && s.categoryChipNameSelected,
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.categoryAddChip} activeOpacity={0.7}>
                <Text style={s.categoryAddText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 8. Subtasks */}
          <View style={s.section}>
            {subtasks.length > 0 && subtasks.map(st => (
              <View key={st.id} style={s.subtaskRow}>
                <TouchableOpacity
                  style={[s.subtaskCheckbox, st.done && s.subtaskCheckboxDone]}
                  onPress={() => toggleSubtask(st.id)}
                >
                  {st.done && <Text style={s.subtaskCheck}>{'\u2713'}</Text>}
                </TouchableOpacity>
                <Text style={[s.subtaskLabel, st.done && s.subtaskLabelDone]}>{st.title}</Text>
                <TouchableOpacity onPress={() => removeSubtask(st.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.subtaskRemove}>{'\u2715'}</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add subtask row */}
            {newSubtask !== '' ? (
              <View style={s.subtaskAddRow}>
                <TouchableOpacity style={s.addCircle} onPress={addSubtaskItem}>
                  <Text style={s.addCircleText}>+</Text>
                </TouchableOpacity>
                <TextInput
                  style={s.subtaskInput}
                  placeholder="Subtask name..."
                  placeholderTextColor={colors.muted}
                  value={newSubtask}
                  onChangeText={setNewSubtask}
                  onSubmitEditing={addSubtaskItem}
                  returnKeyType="done"
                  maxLength={80}
                  autoFocus
                />
              </View>
            ) : (
              <TouchableOpacity
                style={s.subtaskAddRow}
                onPress={() => setNewSubtask(' ')}
                activeOpacity={0.7}
              >
                <View style={s.addCircle}>
                  <Text style={s.addCircleText}>+</Text>
                </View>
                <Text style={s.subtaskPlaceholder}>
                  {subtasks.length > 0 ? '' : 'Subtask'}
                </Text>
                {subtasks.length > 0 && (
                  <Text style={s.subtaskCount}>{doneCount}/{subtasks.length}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Error */}
          {errorMessage && (
            <Text style={s.error}>{errorMessage}</Text>
          )}

          {/* 9. Create / Save button */}
          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>{isEdit ? 'Save' : 'Create'}</Text>
            )}
          </TouchableOpacity>

          {/* 10. Delete link (edit mode only) */}
          {isEdit && (
            <TouchableOpacity style={s.deleteLink} onPress={handleDelete} activeOpacity={0.6}>
              <Text style={s.deleteLinkText}>Delete activity</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Calendar Modal ─── */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandleBar}><View style={s.handle} /></View>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setCalendarMonth(prev => addDays(startOfMonth(prev), -1))} style={s.modalNav}>
                <Text style={s.modalNavText}>{'\u2039'}</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>{format(calendarMonth, 'MMMM yyyy')}</Text>
              <TouchableOpacity onPress={() => setCalendarMonth(prev => addDays(endOfMonth(prev), 1))} style={s.modalNav}>
                <Text style={s.modalNavText}>{'\u203A'}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.calendarWeekRow}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                <Text key={d} style={s.calendarWeekDay}>{d}</Text>
              ))}
            </View>
            <View style={s.calendarGrid}>
              {calendarDays.map((day, i) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, calendarMonth);
                const isSelected = dayStr === selectedDateStr;
                const isToday = isSameDay(day, new Date());
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.calendarDay, isSelected && s.calendarDaySelected]}
                    onPress={() => { pickDate(dayStr); setShowCalendar(false); }}
                  >
                    <Text style={[
                      s.calendarDayText,
                      !inMonth && s.calendarDayMuted,
                      isSelected && s.calendarDayTextSelected,
                      isToday && !isSelected && s.calendarDayToday,
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={s.modalDoneBtn} onPress={() => setShowCalendar(false)}>
              <Text style={s.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Time Picker Modal ─── */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandleBar}><View style={s.handle} /></View>
            <Text style={[s.modalTitle, { textAlign: 'center', marginBottom: 16 }]}>Pick Time</Text>
            <View style={s.timePickerRow}>
              {/* Hour column */}
              <View style={s.timePickerCol}>
                <Text style={s.timePickerLabel}>Hour</Text>
                <ScrollView style={s.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[s.timePickerItem, tempHour === h && s.timePickerItemSelected]}
                      onPress={() => setTempHour(h)}
                    >
                      <Text style={[s.timePickerItemText, tempHour === h && s.timePickerItemTextSel]}>
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Text style={s.timePickerColon}>:</Text>
              {/* Minute column */}
              <View style={s.timePickerCol}>
                <Text style={s.timePickerLabel}>Min</Text>
                <ScrollView style={s.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {MINUTES_5.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[s.timePickerItem, tempMinute === m && s.timePickerItemSelected]}
                      onPress={() => setTempMinute(m)}
                    >
                      <Text style={[s.timePickerItemText, tempMinute === m && s.timePickerItemTextSel]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={s.timePickerPreview}>
              {tempHour.toString().padStart(2, '0')}:{tempMinute.toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity style={s.modalDoneBtn} onPress={confirmTimePick}>
              <Text style={s.modalDoneBtnText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───

const CHIP_BG = 'rgba(255,255,255,0.55)';
const CHIP_SELECTED_BG = '#2D5A3E';

const s = StyleSheet.create({
  // Layout
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  overlayDismiss: { height: 60 },
  sheet: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleBar: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },

  // 1. Title
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
    minHeight: 48,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: CHIP_BG,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipSmall: {
    backgroundColor: CHIP_BG,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: CHIP_SELECTED_BG,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipSmallText: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  chipMuted: {
    backgroundColor: 'rgba(140,133,125,0.12)',
  },
  chipTextMuted: {
    color: colors.muted,
  },

  // Task hint
  taskHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  // Line input (bottom border only)
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(222,214,202,0.25)',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  sparkleBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sparkleText: {
    fontSize: 18,
  },

  // Repeat panel
  repeatPanel: {
    marginTop: 10,
  },

  // Day-of-week circles
  dowRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  dowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CHIP_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dowCircleSelected: {
    backgroundColor: CHIP_SELECTED_BG,
  },
  dowText: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  dowTextSelected: {
    color: '#fff',
  },

  // Never ends
  neverEndsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 4,
  },
  neverEndsLabel: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '500',
  },

  // Category chips
  categoryChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CHIP_BG,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  categoryChipSelected: {
    backgroundColor: CHIP_SELECTED_BG,
  },
  categoryChipEmoji: {
    fontSize: 14,
  },
  categoryChipName: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipNameSelected: {
    color: '#fff',
  },
  categoryAddChip: {
    backgroundColor: CHIP_BG,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  categoryAddText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '500',
  },

  // Subtasks
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckboxDone: {
    backgroundColor: CHIP_SELECTED_BG,
    borderColor: CHIP_SELECTED_BG,
  },
  subtaskCheck: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  subtaskLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '400',
  },
  subtaskLabelDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  subtaskRemove: {
    color: colors.muted,
    fontSize: 12,
  },
  subtaskAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  addCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CHIP_SELECTED_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: -1,
  },
  subtaskPlaceholder: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  subtaskCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  subtaskInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(222,214,202,0.25)',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },

  // Error
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },

  // Save button
  saveBtn: {
    backgroundColor: '#2D5A3E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    minHeight: 52,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Delete link
  deleteLink: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteLinkText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── Modal shared ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandleBar: { alignItems: 'center', marginBottom: 8 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalNav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalNavText: { color: colors.primary, fontSize: 24, fontWeight: '600' },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  modalDoneBtn: {
    backgroundColor: '#2D5A3E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // ─── Calendar ───
  calendarWeekRow: { flexDirection: 'row', marginBottom: 8 },
  calendarWeekDay: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: { backgroundColor: '#2D5A3E', borderRadius: 20 },
  calendarDayText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  calendarDayMuted: { color: colors.muted, opacity: 0.4 },
  calendarDayTextSelected: { color: '#fff', fontWeight: '700' },
  calendarDayToday: { color: '#2D5A3E', fontWeight: '700' },

  // ─── Time Picker ───
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timePickerCol: { alignItems: 'center', flex: 1 },
  timePickerLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timePickerScroll: {
    height: 220,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  timePickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  timePickerItemSelected: {
    backgroundColor: colors.primaryBg,
  },
  timePickerItemText: {
    color: colors.text2,
    fontSize: 18,
    fontWeight: '500',
  },
  timePickerItemTextSel: {
    color: '#2D5A3E',
    fontWeight: '700',
  },
  timePickerColon: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
  },
  timePickerPreview: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
});
