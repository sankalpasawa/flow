import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Alert, FlatList,
} from 'react-native';
import { format, parseISO, addMinutes, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
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

const DURATION_PRESETS = [0, 15, 30, 60];
const MINUTE_INCREMENTS = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10,...55
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const ALL_WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const REPEAT_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKDAYS', label: 'Weekdays' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

export function ActivityFormScreen({ route, navigation }: Props) {
  const { activityId, startHour, date, backlog } = route.params ?? {};
  const { user } = useAuthStore();
  const { activities, untimedTasks, backlog: storeBacklog, planActivities, planTasks, carryForward, addActivity, editActivity, removeActivity } = useActivitiesStore();
  const existingActivity = activityId
    ? (activities.find(a => a.id === activityId)
      || untimedTasks.find(a => a.id === activityId)
      || storeBacklog.find(a => a.id === activityId)
      || planActivities.find(a => a.id === activityId)
      || planTasks.find(a => a.id === activityId)
      || carryForward.find(a => a.id === activityId)
      || null)
    : null;

  const [title, setTitle] = useState(existingActivity?.title ?? '');
  const [description, setDescription] = useState(existingActivity?.description ?? '');
  const [duration, setDuration] = useState(existingActivity?.duration_minutes ?? (backlog ? 0 : 15));
  const [customDuration, setCustomDuration] = useState('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [isScheduled] = useState(
    existingActivity ? existingActivity.is_scheduled : !backlog
  );

  const initialDate = (() => {
    if (existingActivity) return existingActivity.start_time.substring(0, 10);
    return date ?? format(new Date(), 'yyyy-MM-dd');
  })();
  const initialHour = (() => {
    if (existingActivity) return parseISO(existingActivity.start_time).getHours();
    return startHour ? parseInt(startHour.split(':')[0]) : new Date().getHours() + 1;
  })();
  const initialMinute = (() => {
    if (existingActivity) return parseISO(existingActivity.start_time).getMinutes();
    return startHour && startHour.includes(':') ? parseInt(startHour.split(':')[1]) : 0;
  })();

  const [selectedDateStr, setSelectedDateStr] = useState(initialDate);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => parseISO(initialDate + 'T00:00:00'));

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [startTime, setStartTime] = useState(() => {
    if (existingActivity) return existingActivity.start_time;
    const dt = new Date(`${initialDate}T${initialHour.toString().padStart(2, '0')}:${initialMinute.toString().padStart(2, '0')}:00`);
    return dt.toISOString();
  });
  const [categoryId, setCategoryId] = useState(existingActivity?.category_id ?? SYSTEM_CATEGORIES[0].id);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(existingActivity?.recurrence_type ?? 'NONE');
  const [recurrenceDays, setRecurrenceDays] = useState<Weekday[]>(existingActivity?.recurrence_days ?? []);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>(existingActivity?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtasks, setShowSubtasks] = useState((existingActivity?.subtasks ?? []).length > 0);
  const [showNotes, setShowNotes] = useState(!!(existingActivity?.description));
  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs for scroll pickers
  const hourScrollRef = useRef<FlatList>(null);
  const minuteScrollRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) getCategories(user.id).then(setCategories).catch((err) => {
      console.error('[DayFlow] Failed to load categories:', err);
    });
  }, [user]);

  // Sync startTime when hour/minute change via picker
  const syncStartTime = useCallback((h: number, m: number) => {
    const newDt = new Date(`${selectedDateStr}T${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
    setStartTime(newDt.toISOString());
  }, [selectedDateStr]);

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
        const newAssignedDate = isScheduled
          ? selectedDateStr
          : (existingActivity.is_scheduled ? null : existingActivity.assigned_date);
        await editActivity(existingActivity.id, {
          title: title.trim(), description: description.trim() || null,
          start_time: startTime, duration_minutes: duration,
          category_id: categoryId, is_scheduled: isScheduled,
          assigned_date: newAssignedDate,
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

  function pickDate(dateStr: string) {
    setSelectedDateStr(dateStr);
    const newDt = new Date(`${dateStr}T${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}:00`);
    setStartTime(newDt.toISOString());
  }

  function confirmTimePick() {
    syncStartTime(selectedHour, selectedMinute);
    setShowTimePicker(false);
  }

  function handleCustomDurationSubmit() {
    const val = parseInt(customDuration);
    if (!isNaN(val) && val > 0) {
      setDuration(val);
    }
    setShowCustomDuration(false);
    setCustomDuration('');
  }

  // Calendar grid
  const calendarDays = (() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  })();

  const startDt = parseISO(startTime);
  const endDt = addMinutes(startDt, duration);

  const selectedCategory = categories.find(c => c.id === categoryId) ?? categories[0];
  const isCustomDuration = !DURATION_PRESETS.includes(duration);

  const ITEM_HEIGHT = 44;

  const isPast = existingActivity && new Date(existingActivity.start_time).getTime() + existingActivity.duration_minutes * 60000 < Date.now();

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
          <Text style={styles.sheetTitle}>{existingActivity ? 'Edit Activity' : 'New Activity'}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.sheetClose}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Log Experience — prominent at top for past activities */}
          {isPast && (
            <TouchableOpacity
              style={styles.logButtonTop}
              onPress={() => navigation.navigate('LogForm', { activityId: existingActivity!.id })}
              accessibilityLabel="Log experience"
              accessibilityRole="button"
            >
              <Text style={styles.logButtonTopText}>Log Experience</Text>
            </TouchableOpacity>
          )}

          {/* Title — hero input */}
          <TextInput
            style={styles.titleInput}
            placeholder="What needs to happen?"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            autoFocus={!existingActivity}
            accessibilityLabel="Activity title"
          />

          {/* Date row */}
          {isScheduled && (
            <TouchableOpacity
              style={styles.formRow}
              onPress={() => { setCalendarMonth(parseISO(selectedDateStr + 'T00:00:00')); setShowCalendar(true); }}
              activeOpacity={0.6}
            >
              <Text style={styles.formRowIcon}>{'📅'}</Text>
              <Text style={styles.formRowLabel}>
                {selectedDateStr === format(new Date(), 'yyyy-MM-dd')
                  ? 'Today'
                  : selectedDateStr === format(addDays(new Date(), 1), 'yyyy-MM-dd')
                    ? 'Tomorrow'
                    : format(parseISO(selectedDateStr + 'T00:00:00'), 'EEE, MMM d')}
              </Text>
              <Text style={styles.formRowChevron}>{'>'}</Text>
            </TouchableOpacity>
          )}

          {/* Time row */}
          {isScheduled && (
            <TouchableOpacity
              style={styles.formRow}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.6}
            >
              <Text style={styles.formRowIcon}>{'🕐'}</Text>
              <Text style={styles.formRowLabel}>
                {format(startDt, 'HH:mm')}
                {duration > 0 ? ` \u2192 ${format(endDt, 'HH:mm')}` : ''}
              </Text>
              <Text style={styles.formRowChevron}>{'>'}</Text>
            </TouchableOpacity>
          )}

          {/* Duration pills */}
          <Text style={styles.sectionLabel}>DURATION</Text>
          <View style={styles.durationGrid}>
            {DURATION_PRESETS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationPill, duration === d && styles.durationPillSelected]}
                onPress={() => { setDuration(d); setShowCustomDuration(false); }}
                accessibilityLabel={`${d} minutes`}
                accessibilityState={{ selected: duration === d }}
              >
                <Text style={[styles.durationPillText, duration === d && styles.durationPillTextSelected]}>
                  {d === 0 ? 'None' : d < 60 ? `${d}m` : `${d / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
            {isCustomDuration && !showCustomDuration ? (
              <TouchableOpacity
                style={[styles.durationPill, styles.durationPillSelected]}
                onPress={() => setShowCustomDuration(true)}
                accessibilityLabel="Custom duration"
              >
                <Text style={[styles.durationPillText, styles.durationPillTextSelected]}>
                  {`${duration}m`}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.durationPillCircle, showCustomDuration && styles.durationPillSelected]}
              onPress={() => setShowCustomDuration(prev => !prev)}
              accessibilityLabel="Custom duration"
            >
              <Text style={[styles.durationPillCircleText, showCustomDuration && styles.durationPillTextSelected]}>
                +
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom duration input */}
          {showCustomDuration && (
            <View style={styles.customDurationRow}>
              <TextInput
                style={styles.customDurationInput}
                placeholder="Minutes"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={customDuration}
                onChangeText={setCustomDuration}
                onSubmitEditing={handleCustomDurationSubmit}
                autoFocus
                maxLength={4}
              />
              <TouchableOpacity style={styles.customDurationBtn} onPress={handleCustomDurationSubmit}>
                <Text style={styles.customDurationBtnText}>Set</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Category row */}
          <TouchableOpacity
            style={styles.formRow}
            onPress={() => setShowCategoryPicker(true)}
            activeOpacity={0.6}
          >
            <Text style={styles.formRowIcon}>{selectedCategory?.icon ?? ''}</Text>
            <Text style={styles.formRowLabel}>{selectedCategory?.name ?? 'Category'}</Text>
            <Text style={styles.formRowChevron}>{'>'}</Text>
          </TouchableOpacity>

          {/* Frequency row */}
          <TouchableOpacity
            style={styles.formRow}
            onPress={() => {
              if (recurrence === 'NONE') {
                setShowRepeatPicker(true);
              } else {
                setRecurrence('NONE');
                setRecurrenceDays([]);
              }
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.formRowIcon}>{'🔄'}</Text>
            <Text style={styles.formRowLabel}>
              {recurrence === 'NONE' ? 'Once' : REPEAT_OPTIONS.find(o => o.value === recurrence)?.label ?? recurrence}
            </Text>
            {recurrence === 'NONE' ? (
              <Text style={styles.formRowChevron}>{'>'}</Text>
            ) : (
              <Text style={styles.formRowClear}>{'Clear'}</Text>
            )}
          </TouchableOpacity>

          {/* Day picker for weekly */}
          {showDayPicker && (
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
          )}

          {/* Subtasks — expandable */}
          <TouchableOpacity
            style={styles.expandableRow}
            onPress={() => setShowSubtasks(prev => !prev)}
            activeOpacity={0.6}
          >
            <Text style={styles.expandableLabel}>Subtasks</Text>
            {subtasks.length > 0 && (
              <Text style={styles.expandableBadge}>{subtasks.length}</Text>
            )}
            <Text style={styles.expandableChevron}>{showSubtasks ? '\u2303' : '\u2304'}</Text>
          </TouchableOpacity>

          {showSubtasks && (
            <View style={styles.expandableContent}>
              {subtasks.map((st) => (
                <View key={st.id} style={styles.subtaskItem}>
                  <TouchableOpacity
                    style={[styles.subtaskCheckbox, st.done && styles.subtaskCheckboxDone]}
                    onPress={() => toggleSubtask(st.id)}
                  >
                    {st.done && <Text style={styles.subtaskCheckmark}>{'\u2713'}</Text>}
                  </TouchableOpacity>
                  <Text style={[styles.subtaskTitle, st.done && styles.subtaskTitleDone]}>{st.title}</Text>
                  <TouchableOpacity onPress={() => removeSubtask(st.id)} style={styles.subtaskRemove}>
                    <Text style={styles.subtaskRemoveText}>{'\u2715'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.subtaskAddRow}>
                <TextInput
                  style={styles.subtaskInput}
                  placeholder="Add a subtask..."
                  placeholderTextColor={colors.muted}
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
            </View>
          )}

          {/* Notes — expandable */}
          <TouchableOpacity
            style={styles.expandableRow}
            onPress={() => setShowNotes(prev => !prev)}
            activeOpacity={0.6}
          >
            <Text style={styles.expandableLabel}>Notes</Text>
            {!!description && <Text style={styles.expandableBadge}>{'\u2022'}</Text>}
            <Text style={styles.expandableChevron}>{showNotes ? '\u2303' : '\u2304'}</Text>
          </TouchableOpacity>

          {showNotes && (
            <View style={styles.expandableContent}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add details or notes..."
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
                accessibilityLabel="Activity notes"
              />
            </View>
          )}

          {errorMessage && (
            <Text style={{ color: colors.danger, fontSize: 14, textAlign: 'center', marginTop: 12 }}>{errorMessage}</Text>
          )}

          {existingActivity && (
            <>
              {!isPast && (
                <TouchableOpacity
                  style={styles.logButton}
                  onPress={() => navigation.navigate('LogForm', { activityId: existingActivity.id })}
                  accessibilityLabel="Log experience"
                  accessibilityRole="button"
                >
                  <Text style={styles.logButtonText}>Log Experience</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  const doDelete = () => {
                    removeActivity(existingActivity.id);
                    navigation.goBack();
                  };
                  if (Platform.OS === 'web') {
                    if (window.confirm('Delete this activity? This cannot be undone.')) {
                      doDelete();
                    }
                  } else {
                    Alert.alert(
                      'Delete Activity',
                      'Delete this activity? This cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: doDelete },
                      ],
                    );
                  }
                }}
                accessibilityLabel="Delete activity"
                accessibilityRole="button"
              >
                <Text style={styles.deleteButtonText}>Delete Activity</Text>
              </TouchableOpacity>
            </>
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

      {/* ─── Calendar modal ─── */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar}><View style={styles.handle} /></View>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCalendarMonth(prev => addDays(startOfMonth(prev), -1))} style={styles.modalNav}>
                <Text style={styles.modalNavText}>{'\u2039'}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{format(calendarMonth, 'MMMM yyyy')}</Text>
              <TouchableOpacity onPress={() => setCalendarMonth(prev => addDays(endOfMonth(prev), 1))} style={styles.modalNav}>
                <Text style={styles.modalNavText}>{'\u203A'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeekRow}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                <Text key={d} style={styles.calendarWeekDay}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, i) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, calendarMonth);
                const isSelected = dayStr === selectedDateStr;
                const isToday = isSameDay(day, new Date());
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                    onPress={() => { pickDate(dayStr); setShowCalendar(false); }}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      !inMonth && styles.calendarDayMuted,
                      isSelected && styles.calendarDayTextSelected,
                      isToday && !isSelected && styles.calendarDayToday,
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowCalendar(false)}>
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Time picker modal ─── */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar}><View style={styles.handle} /></View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 16 }]}>Pick Time</Text>
            <View style={styles.timePickerRow}>
              {/* Hour column */}
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>Hour</Text>
                <View style={styles.timePickerList}>
                  <FlatList
                    ref={hourScrollRef}
                    data={HOURS}
                    keyExtractor={(item) => `h-${item}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.timePickerItem, selectedHour === item && styles.timePickerItemSelected]}
                        onPress={() => setSelectedHour(item)}
                      >
                        <Text style={[styles.timePickerItemText, selectedHour === item && styles.timePickerItemTextSelected]}>
                          {item.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                    initialScrollIndex={Math.max(0, selectedHour - 2)}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
              <Text style={styles.timePickerColon}>:</Text>
              {/* Minute column */}
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerColumnLabel}>Min</Text>
                <View style={styles.timePickerList}>
                  <FlatList
                    ref={minuteScrollRef}
                    data={MINUTE_INCREMENTS}
                    keyExtractor={(item) => `m-${item}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.timePickerItem, selectedMinute === item && styles.timePickerItemSelected]}
                        onPress={() => setSelectedMinute(item)}
                      >
                        <Text style={[styles.timePickerItemText, selectedMinute === item && styles.timePickerItemTextSelected]}>
                          {item.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                    initialScrollIndex={Math.max(0, MINUTE_INCREMENTS.indexOf(selectedMinute) - 2)}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </View>
            <Text style={styles.timePickerPreview}>
              {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={confirmTimePick}>
              <Text style={styles.modalDoneBtnText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Category picker modal ─── */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar}><View style={styles.handle} /></View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 16 }]}>Category</Text>
            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryItem, categoryId === cat.id && { backgroundColor: cat.color + '18' }]}
                  onPress={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}
                >
                  <Text style={styles.categoryItemIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryItemName, categoryId === cat.id && { color: cat.color, fontWeight: '700' }]}>{cat.name}</Text>
                  {categoryId === cat.id && <Text style={[styles.categoryItemCheck, { color: cat.color }]}>{'\u2713'}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowCategoryPicker(false)}>
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Repeat picker modal ─── */}
      <Modal visible={showRepeatPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar}><View style={styles.handle} /></View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 16 }]}>Repeat</Text>
            {REPEAT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.repeatItem, recurrence === opt.value && styles.repeatItemSelected]}
                onPress={() => {
                  setRecurrence(opt.value);
                  if (opt.value !== 'WEEKLY') setRecurrenceDays([]);
                  setShowRepeatPicker(false);
                }}
              >
                <Text style={[styles.repeatItemText, recurrence === opt.value && styles.repeatItemTextSelected]}>
                  {opt.label}
                </Text>
                {recurrence === opt.value && (
                  <Text style={styles.repeatItemCheck}>{'\u2713'}</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.repeatItem, { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}
              onPress={() => { setRecurrence('NONE'); setRecurrenceDays([]); setShowRepeatPicker(false); }}
            >
              <Text style={[styles.repeatItemText, { color: colors.muted }]}>No repeat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalDoneBtn, { marginTop: 16 }]} onPress={() => setShowRepeatPicker(false)}>
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: { padding: 20, paddingTop: 4, paddingBottom: 40 },

  // Title — hero
  titleInput: {
    fontSize: 20, fontWeight: '600', color: colors.text,
    backgroundColor: 'transparent', borderWidth: 0,
    paddingHorizontal: 0, paddingVertical: 12, minHeight: 48,
  },

  // Section label
  sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, marginBottom: 8, marginTop: 20, textTransform: 'uppercase' },

  // Form rows (date, time, category, frequency)
  formRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  formRowIcon: { fontSize: 18 },
  formRowLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  formRowChevron: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  formRowClear: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // Duration pills (borderless, filled bg)
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationPill: {
    backgroundColor: colors.surface2, borderRadius: radii.pill,
    paddingVertical: 8, paddingHorizontal: 16, minHeight: 36, justifyContent: 'center',
  },
  durationPillSelected: { backgroundColor: colors.primary },
  durationPillText: { color: colors.text2, fontSize: 13, fontWeight: '600' },
  durationPillTextSelected: { color: '#fff' },

  // Custom duration
  customDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  customDurationInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 15,
  },
  customDurationBtn: {
    backgroundColor: colors.primary, borderRadius: radii.sm,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  customDurationBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Expandable sections (subtasks, notes)
  expandableRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  expandableLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  expandableBadge: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  expandableChevron: { color: colors.muted, fontSize: 18 },
  expandableContent: { paddingTop: 8, paddingBottom: 4 },

  // Day picker
  dayPickerRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between', marginTop: 8 },
  dayChip: {
    flex: 1, backgroundColor: colors.surface2, borderRadius: radii.sm,
    paddingVertical: 10, alignItems: 'center', minHeight: 40,
  },
  dayChipSelected: { backgroundColor: colors.primary },
  dayText: { color: colors.text2, fontSize: 12, fontWeight: '600' },
  dayTextSelected: { color: '#fff' },

  // Subtasks
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
  subtaskAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
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

  // Notes
  notesInput: {
    backgroundColor: colors.surface, borderRadius: radii.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14,
    minHeight: 80, textAlignVertical: 'top',
  },

  // Duration pill — circular "+" button
  durationPillCircle: {
    backgroundColor: colors.surface2, borderRadius: 18,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  durationPillCircleText: { color: colors.text2, fontSize: 18, fontWeight: '600' },

  // Buttons
  logButtonTop: {
    backgroundColor: colors.primary, borderRadius: radii.button,
    paddingVertical: 14, alignItems: 'center', marginBottom: 8, minHeight: 44,
  },
  logButtonTopText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  logButton: {
    backgroundColor: colors.primaryBg, borderRadius: radii.button,
    paddingVertical: 16, alignItems: 'center', marginTop: 24, minHeight: 44,
  },
  logButtonText: { color: colors.primary, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  deleteButton: {
    paddingVertical: 14, alignItems: 'center', marginTop: 12, minHeight: 44,
  },
  deleteButtonText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: radii.button,
    paddingVertical: 16, alignItems: 'center', marginTop: 32, minHeight: 44,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },

  // ─── Modal shared ───
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet,
    padding: spacing.xxl, paddingBottom: 40,
  },
  modalHandleBar: { alignItems: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalNav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalNavText: { color: colors.primary, fontSize: 24, fontWeight: '600' },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  modalDoneBtn: {
    backgroundColor: colors.primary, borderRadius: radii.button,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  modalDoneBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // ─── Calendar ───
  calendarWeekRow: { flexDirection: 'row', marginBottom: 8 },
  calendarWeekDay: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
  },
  calendarDaySelected: { backgroundColor: colors.primary, borderRadius: 20 },
  calendarDayText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  calendarDayMuted: { color: colors.muted, opacity: 0.4 },
  calendarDayTextSelected: { color: '#fff', fontWeight: '700' },
  calendarDayToday: { color: colors.primary, fontWeight: '700' },

  // ─── Time picker ───
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  timePickerColumn: { alignItems: 'center', flex: 1 },
  timePickerColumnLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  timePickerList: { height: 220, overflow: 'hidden', borderRadius: radii.md, backgroundColor: colors.surface },
  timePickerItem: {
    height: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  timePickerItemSelected: { backgroundColor: colors.primaryBg },
  timePickerItemText: { color: colors.text2, fontSize: 18, fontWeight: '500' },
  timePickerItemTextSelected: { color: colors.primary, fontWeight: '700' },
  timePickerColon: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: 20 },
  timePickerPreview: {
    textAlign: 'center', color: colors.text, fontSize: 32, fontWeight: '700',
    marginTop: 16, marginBottom: 4,
  },

  // ─── Category picker ───
  categoryList: { maxHeight: 340 },
  categoryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: radii.sm,
    marginBottom: 2,
  },
  categoryItemIcon: { fontSize: 20 },
  categoryItemName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  categoryItemCheck: { fontSize: 16, fontWeight: '700' },

  // ─── Repeat picker ───
  repeatItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: radii.sm,
    marginBottom: 2,
  },
  repeatItemSelected: { backgroundColor: colors.primaryBg },
  repeatItemText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  repeatItemTextSelected: { color: colors.primary, fontWeight: '700' },
  repeatItemCheck: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
