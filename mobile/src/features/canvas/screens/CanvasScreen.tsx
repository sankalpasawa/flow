import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Platform, RefreshControl, useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { format, isSameDay, isWithinInterval, parseISO, addDays, subDays } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { DateStrip } from '../components/DateStrip';
import { ActivityCard } from '../components/ActivityCard';
import { TaskSection } from '../components/TaskSection';
import { Activity } from '../../../types';
import { colors, shadows, spacing, text, ui, sizes } from '../../../theme';
import {
  HOUR_HEIGHT, START_HOUR, END_HOUR, HOUR_LABEL_WIDTH,
  TOTAL_CANVAS_HEIGHT, getActivityPosition, formatHour,
} from '../../../lib/calendar';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

function computeOverlapLayout(activities: Activity[]): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>();
  if (activities.length === 0) return result;

  const parsed = activities.map((a) => {
    const start = parseISO(a.start_time).getTime();
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
  const { width: windowWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);

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

  // Scroll to current hour when viewing today
  useEffect(() => {
    if (!isSameDay(selectedDate, new Date())) return;
    const timer = setTimeout(() => {
      const y = Math.max(0, (new Date().getHours() - 2) * HOUR_HEIGHT);
      scrollRef.current?.scrollTo({ y, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  const now = new Date();
  const isToday = isSameDay(selectedDate, now);

  const timedActivities = useMemo(() =>
    activities.filter((a) => {
      const start = parseISO(a.start_time);
      return isSameDay(start, selectedDate) && start.getHours() >= START_HOUR;
    }),
    [activities, selectedDate]
  );

  const overlapLayout = useMemo(() => computeOverlapLayout(timedActivities), [timedActivities]);

  const ACTIVITY_RIGHT_MARGIN = 12;
  const availableWidth = windowWidth - HOUR_LABEL_WIDTH - ACTIVITY_RIGHT_MARGIN;

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = START_HOUR; i < END_HOUR; i++) h.push(i);
    return h;
  }, []);

  const nowY = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  // Horizontal swipe to change day
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-10, 10])
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationX) > 60) {
        const direction = e.translationX > 0 ? -1 : 1;
        runOnJS(changeDay)(direction);
      }
    });

  function changeDay(direction: number) {
    const newDate = direction === 1 ? addDays(selectedDate, 1) : subDays(selectedDate, 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(newDate);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
        </Text>
        <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Search')}>
          <Text style={styles.searchIcon}>{'\u2315'}</Text>
        </TouchableOpacity>
      </View>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Tasks — pinned above canvas */}
      <TaskSection
        tasks={untimedTasks}
        todayStr={format(new Date(), 'yyyy-MM-dd')}
        onToggle={(id) => quickToggleComplete(id)}
        onPress={(id) => navigation.navigate('ActivityForm', { activityId: id })}
        onQuickAdd={(title) => {
          if (user) addTask({ user_id: user.id, title, assigned_date: format(selectedDate, 'yyyy-MM-dd') });
        }}
      />

      {/* Canvas — single day, swipe left/right to change day */}
      <GestureDetector gesture={swipeGesture}>
      <View nativeID="canvas-wrapper" style={styles.canvasWrapper}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.canvas}
            contentContainerStyle={{ height: TOTAL_CANVAS_HEIGHT + 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            <View style={styles.timeline}>
              {/* Hour grid */}
              {hours.map((h) => {
                const y = (h - START_HOUR) * HOUR_HEIGHT;
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
                const y = (h - START_HOUR) * HOUR_HEIGHT;
                return (
                  <TouchableOpacity
                    key={`empty-${h}`}
                    style={[styles.emptyTap, { top: y, height: HOUR_HEIGHT }]}
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

              {/* Empty state — no activities on canvas for this day */}
              {timedActivities.length === 0 && !loading && (
                <View style={styles.canvasEmpty} pointerEvents="none">
                  <Text style={styles.canvasEmptyEmoji}>{isToday ? '☀️' : '✨'}</Text>
                  <Text style={styles.canvasEmptyTitle}>
                    {isToday ? 'Nothing scheduled yet' : 'Free day'}
                  </Text>
                  <Text style={styles.canvasEmptyBody}>
                    Tap any hour slot to add an activity
                  </Text>
                </View>
              )}

              {/* Activity blocks */}
              {timedActivities.map((activity) => {
                const { top, height } = getActivityPosition(activity.start_time, activity.duration_minutes);
                const log = logs[activity.id];
                const actStart = parseISO(activity.start_time);
                const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
                const isCurrentlyActive = isToday && isWithinInterval(now, { start: actStart, end: actEnd });
                const isPast = isToday && actEnd < now;
                const isOverdue = activity.status === 'PLANNED' && actStart < now && !isSameDay(actStart, now);

                const itemLayout = overlapLayout.get(activity.id);
                const colWidth = itemLayout ? availableWidth / itemLayout.totalColumns : availableWidth;
                const leftOffset = itemLayout ? HOUR_LABEL_WIDTH + itemLayout.column * colWidth : HOUR_LABEL_WIDTH;

                return (
                  <View
                    key={activity.id}
                    style={[
                      styles.activityBlock,
                      { top, height, left: leftOffset, width: colWidth, right: undefined },
                      isPast && { opacity: 0.7 },
                    ]}
                  >
                    <ActivityCard
                      activity={activity}
                      log={log}
                      isNow={isCurrentlyActive}
                      isOverdue={isOverdue}
                      height={height}
                      onPress={() => navigation.navigate('ActivityForm', { activityId: activity.id })}
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

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ActivityForm', { date: format(selectedDate, 'yyyy-MM-dd') })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { ...ui.screenContainer },
  header: {
    ...ui.screenHeader,
    paddingTop: 12,
    paddingBottom: 2,
  },
  headerTitle: { ...ui.screenTitle },
  searchBtn: { width: sizes.touchTarget, height: sizes.touchTarget, borderRadius: sizes.touchTarget / 2, alignItems: 'center', justifyContent: 'center' },
  searchIcon: { color: colors.muted, fontSize: 22 },

  loadingContainer: { ...ui.loading },
  canvasWrapper: { flex: 1 },
  canvas: { flex: 1 },

  timeline: { position: 'relative', width: '100%', height: TOTAL_CANVAS_HEIGHT },

  hourRow: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingLeft: 8,
    height: 0, overflow: 'visible', zIndex: 1,
  },
  hourLabel: {
    color: colors.muted, ...text.caption,
    width: HOUR_LABEL_WIDTH - 8, textAlign: 'right', marginRight: 8, marginTop: -14,
  },
  hourNow: { color: colors.terra, fontWeight: '700' },
  hourLine: { flex: 1, height: 1, backgroundColor: colors.border },
  hourLinePast: { opacity: 0.5 },

  nowIndicator: {
    position: 'absolute', left: HOUR_LABEL_WIDTH - 4, right: 0,
    flexDirection: 'row', alignItems: 'center',
    height: 0, overflow: 'visible', zIndex: 10,
  },
  nowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.terra, marginTop: -5, marginLeft: -5 },
  nowLine: { flex: 1, height: 2, backgroundColor: colors.terra },

  emptyTap: {
    position: 'absolute', left: HOUR_LABEL_WIDTH, right: 12,
    zIndex: 0, borderBottomWidth: 1, borderBottomColor: colors.border, borderStyle: 'dashed',
  },

  activityBlock: { position: 'absolute', left: HOUR_LABEL_WIDTH, right: 12, zIndex: 5 },

  // Canvas empty state (centered within the timeline area)
  canvasEmpty: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    pointerEvents: 'none',
  },
  canvasEmptyEmoji: { fontSize: 40, marginBottom: 12 },
  canvasEmptyTitle: {
    color: colors.text2,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  canvasEmptyBody: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  fab: {
    position: 'absolute', bottom: 88, right: 20,
    width: sizes.fab.size, height: sizes.fab.size, borderRadius: sizes.fab.radius,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.fab,
  },
  fabText: { color: '#fff', fontSize: 24, lineHeight: 26, marginTop: -1 },
});
