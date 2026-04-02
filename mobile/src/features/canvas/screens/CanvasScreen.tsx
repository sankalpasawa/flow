import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Platform, RefreshControl, useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { format, isSameDay, isWithinInterval, parseISO, addDays, subDays } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { DateStrip } from '../components/DateStrip';
import { ActivityCard } from '../components/ActivityCard';
// v2: Tasks moved to bottom bar
// import { TaskSection } from '../components/TaskSection';
import { BottomTaskBar } from '../components/BottomTaskBar';
import { Activity } from '../../../types';
import { captureOnContentChange } from '../../../debug/DesignQA';
import { colors, shadows, spacing, type, getCategoryColor } from '../../../theme';
import {
  HOUR_HEIGHT, START_HOUR, END_HOUR, HOUR_LABEL_WIDTH,
  MIN_BLOCK_HEIGHT, getActivityPosition, formatHour,
} from '../../../lib/calendar';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

function computeOverlapLayout(activities: Activity[]): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>();
  if (activities.length === 0) return result;

  const parsed = activities.map((a) => {
    const start = parseISO(a.start_time!).getTime();
    const end = start + a.duration_minutes * 60000;
    return { id: a.id, start, end };
  });
  parsed.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  const groups: (typeof parsed)[] = [];
  let currentGroup = [parsed[0]];
  let groupEnd = parsed[0].end;

  for (let i = 1; i < parsed.length; i++) {
    const item = parsed[i];
    if (item.start < groupEnd) {
      currentGroup.push(item);
      groupEnd = Math.max(groupEnd, item.end);
    } else {
      groups.push(currentGroup);
      currentGroup = [item];
      groupEnd = item.end;
    }
  }
  groups.push(currentGroup);

  for (const group of groups) {
    const columns: number[] = [];
    const assignments = new Map<string, number>();

    for (const item of group) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (item.start >= columns[c]) {
          columns[c] = item.end;
          assignments.set(item.id, c);
          placed = true;
          break;
        }
      }
      if (!placed) {
        assignments.set(item.id, columns.length);
        columns.push(item.end);
      }
    }

    const totalColumns = columns.length;
    for (const item of group) {
      result.set(item.id, { column: assignments.get(item.id)!, totalColumns });
    }
  }

  return result;
}

export function CanvasScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { activities, untimedTasks, logs, loading, selectedDate, setSelectedDate, loadDay, quickToggleComplete, addTask, editActivity } = useActivitiesStore();
  const scrollRef = useRef<ScrollView>(null);
  const hasAutoScrolled = useRef(false);
  const { width: windowWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [hourScale, setHourScale] = useState(1.0);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const load = useCallback(async (date: Date) => {
    if (!user) return;
    await loadDay(user.id, date);
  }, [user, loadDay]);

  useEffect(() => { void load(selectedDate); }, [selectedDate, load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(selectedDate); } finally { setRefreshing(false); }
  }, [load, selectedDate]);

  const handleReschedule = useCallback(async (activityId: string, newStartTime: string) => {
    await editActivity(activityId, { start_time: newStartTime });
    if (user) await loadDay(user.id, selectedDate);
  }, [editActivity, loadDay, user, selectedDate]);

  const effectiveHourHeight = HOUR_HEIGHT * hourScale;

  // CSS fix for web scroll containment
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'dayflow-scroll-fix';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = '#canvas-wrapper { min-height: 0 !important; flex: 1 1 0% !important; overflow: hidden !important; }';
    document.head.appendChild(style);
  }, []);

  // Reset auto-scroll flag when the date changes
  useEffect(() => {
    hasAutoScrolled.current = false;
  }, [selectedDate]);

  // Scroll to current hour when viewing today (only on initial load or date change)
  useEffect(() => {
    if (!isSameDay(selectedDate, new Date())) return;
    if (hasAutoScrolled.current) return;
    hasAutoScrolled.current = true;
    const timer = setTimeout(() => {
      const y = Math.max(0, (new Date().getHours() - 2) * effectiveHourHeight);
      scrollRef.current?.scrollTo({ y, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedDate, effectiveHourHeight]);

  const now = new Date();
  const isToday = isSameDay(selectedDate, now);

  const timedActivities = useMemo(() =>
    activities.filter((a) => {
      if (!a.start_time) return false;
      // Activities with start_time AND activity_type TIME_BLOCK are always pills
      // Activities with start_time AND duration 0 AND type TASK are watermarks
      if (a.duration_minutes === 0 && a.activity_type === 'TASK') return false;
      const start = parseISO(a.start_time);
      return isSameDay(start, selectedDate) && start.getHours() >= START_HOUR;
    }),
    [activities, selectedDate]
  );

  // Watermark activities:
  // 1. Has start_time + duration 0 + type TASK (time-anchored reminder)
  // 2. No start_time + recurring (distributed evenly)
  const watermarkActivities = useMemo(() =>
    activities.filter((a) => {
      // Time-anchored reminders (has time, zero duration, task type)
      if (a.start_time && a.start_time !== '' && a.duration_minutes === 0 && a.activity_type === 'TASK') return true;
      // Untimed recurring
      if ((!a.start_time || a.start_time === '') && a.recurrence_type !== 'NONE') return true;
      return false;
    }),
    [activities]
  );

  // Distribute watermark chips evenly through the day (every 90 min starting from 7:00)
  const watermarkPositions = useMemo(() => {
    const WATERMARK_START_HOUR = 7;
    const WATERMARK_INTERVAL_MIN = 90;
    let untimedIndex = 0;

    return watermarkActivities.map((a) => {
      // Time-anchored: use actual time
      if (a.start_time && a.start_time !== '') {
        const start = parseISO(a.start_time);
        const top = (start.getHours() + start.getMinutes() / 60) * effectiveHourHeight;
        return { activity: a, top };
      }
      // Untimed recurring: distribute evenly
      const minuteOffset = untimedIndex * WATERMARK_INTERVAL_MIN;
      untimedIndex++;
      const hour = WATERMARK_START_HOUR + minuteOffset / 60;
      const top = hour * effectiveHourHeight;
      return { activity: a, top };
    });
  }, [watermarkActivities, effectiveHourHeight]);

  const overlapLayout = useMemo(() => computeOverlapLayout(timedActivities), [timedActivities]);

  const ACTIVITY_RIGHT_MARGIN = 12;
  const availableWidth = windowWidth - HOUR_LABEL_WIDTH - ACTIVITY_RIGHT_MARGIN;

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = START_HOUR; i < END_HOUR; i++) h.push(i);
    return h;
  }, []);

  const navigateToActivity = useCallback((activity: Activity) => {
    // Virtual recurring instances have IDs like "realId_2026-04-03"
    // Strip the date suffix for DB operations
    const datePattern = /_\d{4}-\d{2}-\d{2}$/;
    const activityId = datePattern.test(activity.id) ? activity.id.replace(datePattern, '') : activity.id;

    const shouldLog =
      activity.status === 'COMPLETED' ||
      activity.status === 'SKIPPED';
    if (shouldLog) {
      navigation.navigate('ExperienceLog', { activityId });
    } else {
      navigation.navigate('ActivityForm', { activityId });
    }
  }, [navigation]);

  const nowY = (now.getHours() + now.getMinutes() / 60) * effectiveHourHeight;

  // Horizontal swipe to change day
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-80, 80])
    .failOffsetY([-30, 30])
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationX) > 150) {
        const direction = e.translationX > 0 ? -1 : 1;
        runOnJS(changeDay)(direction);
      }
    });

  function changeDay(direction: number) {
    const newDate = direction === 1 ? addDays(selectedDate, 1) : subDays(selectedDate, 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(newDate);
  }

  const baseScaleRef = useRef(1.0);

  function saveBaseScale() {
    baseScaleRef.current = hourScale;
  }

  function applyPinchScale(gestureScale: number) {
    const newScale = Math.min(2.0, Math.max(0.7, baseScaleRef.current * gestureScale));
    setHourScale(newScale);
  }

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      runOnJS(saveBaseScale)();
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(applyPinchScale)(e.scale);
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, swipeGesture);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
              onPress={() => setViewMode('calendar')}
            >
              <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>Hours</Text>
            </TouchableOpacity>
          </View>
          {!isToday && (
            <TouchableOpacity
              style={styles.todayBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedDate(new Date());
              }}
              activeOpacity={0.7}
            >
              <View style={styles.todayBtnBar} />
              <Text style={styles.todayBtnDate}>{new Date().getDate()}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Search')}>
            <Text style={styles.searchIcon}>{'\u2315'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* v2: Tasks moved to bottom bar */}

      {/* Canvas / List — toggle between hourly canvas and flat list */}
      {viewMode === 'list' ? (
        <View style={styles.canvasWrapper}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : (
            <FlatList
              data={[...timedActivities].sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
              renderItem={({ item }) => {
                const isDone = item.status === 'COMPLETED' || item.status === 'SKIPPED';
                const hasLog = !!logs[item.id];
                const catColor = getCategoryColor(item.category_id);
                // Three states: empty (planned) → half (done, not reflected) → full (reflected)
                const circleStyle = isDone
                  ? (hasLog ? styles.listCircleFull : styles.listCircleHalf)
                  : styles.listCircle;
                return (
                  <View style={styles.listItem}>
                    {/* Circle: tap empty → complete, tap half → open experience log */}
                    <TouchableOpacity
                      style={circleStyle}
                      onPress={() => {
                        if (!isDone) {
                          quickToggleComplete(item.id);
                        } else if (!hasLog) {
                          navigation.navigate('ExperienceLog', { activityId: item.id });
                        }
                      }}
                      activeOpacity={0.6}
                    >
                      {isDone && <Text style={styles.listCircleCheck}>{'\u2713'}</Text>}
                    </TouchableOpacity>

                    {/* Content — tap to open */}
                    <TouchableOpacity style={styles.listContent} onPress={() => navigateToActivity(item)} activeOpacity={0.7}>
                      {/* Row 1: Icon + Title */}
                      <View style={styles.listTitleRow}>
                        <Text style={styles.listIcon}>{item.category?.icon ?? '\u2728'}</Text>
                        <Text style={[styles.listTitle, isDone && styles.listTitleDone]} numberOfLines={2}>{item.title}</Text>
                      </View>
                      {/* Row 2: Mindset */}
                      {item.mindset_prompt && <Text style={styles.listMindset} numberOfLines={2}>{item.mindset_prompt}</Text>}
                      {/* Row 3: Time · Duration · Category */}
                      <View style={styles.listMeta}>
                        {item.start_time ? (
                          <Text style={styles.listTime}>{format(parseISO(item.start_time), 'h:mm a')}</Text>
                        ) : null}
                        {item.duration_minutes > 0 && (
                          <>
                            <Text style={styles.listDot}>{'\u00B7'}</Text>
                            <Text style={styles.listTime}>{item.duration_minutes < 60 ? `${item.duration_minutes}m` : `${Math.floor(item.duration_minutes / 60)}h${item.duration_minutes % 60 ? ` ${item.duration_minutes % 60}m` : ''}`}</Text>
                          </>
                        )}
                        {item.category?.name && (
                          <>
                            <Text style={styles.listDot}>{'\u00B7'}</Text>
                            <Text style={[styles.listCat, { color: catColor.solid, backgroundColor: catColor.light }]}>{item.category.name}</Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={styles.listEmpty}>No activities today</Text>}
            />
          )}
        </View>
      ) : (
        <GestureDetector gesture={composedGesture}>
        <View nativeID="canvas-wrapper" style={styles.canvasWrapper}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.canvas}
              contentContainerStyle={{ height: (END_HOUR - START_HOUR) * effectiveHourHeight + 160 }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
              <View style={[styles.timeline, { height: (END_HOUR - START_HOUR) * effectiveHourHeight }]}>
                {/* Hour grid */}
                {hours.map((h) => {
                  const y = (h - START_HOUR) * effectiveHourHeight;
                  const isPastHour = isToday && h < now.getHours();
                  return (
                    <View key={h} style={[styles.hourRow, { top: y }]} pointerEvents="none">
                      <Text style={[styles.hourLabel, isToday && h === now.getHours() && styles.hourNow]}>
                        {formatHour(h)}
                      </Text>
                      <View style={[styles.hourLine, isPastHour && styles.hourLinePast]} />
                    </View>
                  );
                })}

                {/* Empty hour tap targets */}
                {hours.map((h) => {
                  const y = (h - START_HOUR) * effectiveHourHeight;
                  return (
                    <TouchableOpacity
                      key={`empty-${h}`}
                      style={[styles.emptyTap, { top: y, height: effectiveHourHeight }]}
                      onPress={() => navigation.navigate('ActivityForm', { startHour: `${h}:00`, date: format(selectedDate, 'yyyy-MM-dd') })}
                      activeOpacity={0.3}
                    />
                  );
                })}

                {/* Now indicator */}
                {isToday && nowY >= 0 && (
                  <View style={[styles.nowIndicator, { top: nowY }]} pointerEvents="none">
                    <View style={styles.nowDot} />
                    <View style={styles.nowLine} />
                  </View>
                )}

                {/* Watermark chips — recurring untimed activities */}
                {watermarkPositions.map(({ activity: wm, top: wmTop }) => (
                  <View
                    key={`wm-${wm.id}`}
                    style={[styles.watermarkChip, { top: wmTop }]}
                    pointerEvents="none"
                  >
                    <Text style={styles.watermarkText}>
                      {wm.category?.icon ? `${wm.category.icon} ` : ''}{wm.title}
                    </Text>
                  </View>
                ))}

                {/* Activity blocks */}
                {timedActivities.map((activity) => {
                  const actStart = parseISO(activity.start_time!);
                  const top = (actStart.getHours() + actStart.getMinutes() / 60) * effectiveHourHeight;
                  const height = Math.max((activity.duration_minutes / 60) * effectiveHourHeight, MIN_BLOCK_HEIGHT);
                  const log = logs[activity.id];
                  const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
                  const isCurrentlyActive = isToday && isWithinInterval(now, { start: actStart, end: actEnd });
                  const isPast = isToday && actEnd < now;
                  const isOverdue = activity.status === 'PLANNED' && actStart < now && !isSameDay(actStart, now);

                  const itemLayout = overlapLayout.get(activity.id);
                  const GAP = itemLayout && itemLayout.totalColumns > 1 ? 4 : 0;
                  const colWidth = itemLayout ? (availableWidth - GAP * (itemLayout.totalColumns - 1)) / itemLayout.totalColumns : availableWidth;
                  const leftOffset = itemLayout ? HOUR_LABEL_WIDTH + itemLayout.column * (colWidth + GAP) : HOUR_LABEL_WIDTH;

                  return (
                    <View
                      key={activity.id}
                      style={[
                        styles.activityBlock,
                        itemLayout && itemLayout.totalColumns > 1
                          ? { top, height, left: leftOffset, width: colWidth, right: 'auto' as any }
                          : { top, height },
                        (activity.status === 'COMPLETED' || activity.status === 'SKIPPED') && { opacity: 0.5 },
                      ]}
                    >
                      <ActivityCard
                        activity={activity}
                        log={log}
                        isNow={isCurrentlyActive}
                        isOverdue={isOverdue}
                        height={height}
                        onPress={() => navigateToActivity(activity)}
                        onQuickComplete={() => quickToggleComplete(activity.id)}
                        onReschedule={handleReschedule}
                      />
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
        </GestureDetector>
      )}

      {/* Bottom task bar */}
      <BottomTaskBar
        tasks={untimedTasks}
        onToggle={(id) => quickToggleComplete(id)}
        onPress={(id) => {
          const task = untimedTasks.find(t => t.id === id);
          if (task) navigateToActivity(task);
          else navigation.navigate('ActivityForm', { activityId: id });
        }}
        onQuickAdd={(title) => {
          if (!user) return;
          addTask({
            user_id: user.id,
            title,
            category_id: 'sys-personal',
            assigned_date: format(selectedDate, 'yyyy-MM-dd'),
          });
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('QuickAdd', { date: format(selectedDate, 'yyyy-MM-dd') })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 2,
  },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  todayBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'flex-start',
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  todayBtnBar: {
    width: '100%', height: 2, backgroundColor: colors.primary,
  },
  todayBtnDate: {
    color: colors.text, fontSize: 16, fontWeight: '700',
    lineHeight: 20, marginTop: 4,
  },
  searchBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchIcon: { color: colors.muted, fontSize: 24 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  canvasWrapper: { flex: 1 },
  canvas: { flex: 1 },

  timeline: { position: 'relative', width: '100%' },

  hourRow: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingLeft: 4,
    height: 20, marginTop: -10, zIndex: 1,
  },
  hourLabel: {
    color: colors.muted, fontSize: 10, fontWeight: '600' as const,
    width: HOUR_LABEL_WIDTH - 12, textAlign: 'right', marginRight: 8,
    opacity: 0.35,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hourNow: { color: colors.accent, fontWeight: '700', opacity: 1 },
  hourLine: { flex: 1, height: 1, backgroundColor: colors.border, opacity: 0.4 },
  hourLinePast: { opacity: 0.2 },

  nowIndicator: {
    position: 'absolute', left: HOUR_LABEL_WIDTH - 4, right: 0,
    flexDirection: 'row', alignItems: 'center',
    height: 0, overflow: 'visible', zIndex: 10,
  },
  nowDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginTop: -5, marginLeft: -5,
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  nowLine: { flex: 1, height: 2, backgroundColor: colors.accent, opacity: 0.8 },

  emptyTap: {
    position: 'absolute', left: HOUR_LABEL_WIDTH, right: 12,
    zIndex: 0, borderBottomWidth: 1, borderBottomColor: colors.border, borderStyle: 'dashed',
  },

  activityBlock: { position: 'absolute', left: HOUR_LABEL_WIDTH, right: 12, zIndex: 5 },

  watermarkChip: {
    position: 'absolute',
    right: 12,
    zIndex: 8,
    backgroundColor: colors.watermark.bg,
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  watermarkText: {
    color: colors.watermark.text,
    fontSize: 9,
    fontWeight: '600',
  },

  // View toggle (List / Hours)
  toggleRow: { flexDirection: 'row', gap: 4, backgroundColor: colors.surface2, borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.surface },
  toggleText: { fontSize: 12, fontWeight: '500' as const, color: colors.muted },
  toggleTextActive: { color: colors.text, fontWeight: '600' as const },

  // List view items
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  listCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 } as any,
  listCircleHalf: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2, backgroundColor: colors.primaryBg } as any,
  listCircleFull: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 } as any,
  listCircleCheck: { color: '#fff', fontSize: 12, fontWeight: '700' as const },
  listTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listTitleDone: { textDecorationLine: 'line-through', color: colors.muted },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  listDot: { fontSize: 10, color: colors.muted, fontWeight: '700' as const },
  listCat: { fontSize: 11, fontWeight: '600' as const, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 4, overflow: 'hidden' as const },
  listIcon: { fontSize: 20 },
  listContent: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.text },
  listTime: { fontSize: 11, color: colors.muted, marginTop: 2 },
  listMindset: { fontSize: 9.5, fontStyle: 'italic' as const, color: colors.text2, opacity: 0.6, marginTop: 2, lineHeight: 13 },
  listCheck: { fontSize: 16, color: colors.primary },
  listEmpty: { textAlign: 'center' as const, color: colors.muted, marginTop: 40 },

  fab: {
    position: 'absolute', bottom: 88, right: 20,
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.fab,
  },
  fabText: { color: '#fff', fontSize: 24, lineHeight: 26 },
});
