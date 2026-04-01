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
// v2: Tasks moved to bottom bar
// import { TaskSection } from '../components/TaskSection';
import { BottomTaskBar } from '../components/BottomTaskBar';
import { Activity } from '../../../types';
import { captureOnContentChange } from '../../../debug/DesignQA';
import { colors, shadows, spacing, type } from '../../../theme';
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
      if (!a.start_time) return false;
      const start = parseISO(a.start_time);
      return isSameDay(start, selectedDate) && start.getHours() >= START_HOUR;
    }),
    [activities, selectedDate]
  );

  // Watermark activities: no start_time AND recurring (recurrence_type !== 'NONE')
  const watermarkActivities = useMemo(() =>
    activities.filter((a) => !a.start_time && a.recurrence_type !== 'NONE'),
    [activities]
  );

  // Distribute watermark chips evenly through the day (every 90 min starting from 7:00)
  const watermarkPositions = useMemo(() => {
    const WATERMARK_START_HOUR = 7; // start distributing from 7 AM
    const WATERMARK_INTERVAL_MIN = 90; // 90 minutes apart
    return watermarkActivities.map((a, i) => {
      const minuteOffset = i * WATERMARK_INTERVAL_MIN;
      const hour = WATERMARK_START_HOUR + minuteOffset / 60;
      const top = hour * HOUR_HEIGHT;
      return { activity: a, top };
    });
  }, [watermarkActivities]);

  const overlapLayout = useMemo(() => computeOverlapLayout(timedActivities), [timedActivities]);

  const ACTIVITY_RIGHT_MARGIN = 12;
  const availableWidth = windowWidth - HOUR_LABEL_WIDTH - ACTIVITY_RIGHT_MARGIN;

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = START_HOUR; i < END_HOUR; i++) h.push(i);
    return h;
  }, []);

  const navigateToActivity = useCallback((activity: Activity) => {
    const shouldLog =
      activity.status === 'COMPLETED' ||
      activity.status === 'SKIPPED' ||
      (activity.start_time && (() => {
        const actEnd = new Date(parseISO(activity.start_time!).getTime() + activity.duration_minutes * 60000);
        return isToday && actEnd < now && activity.status === 'PLANNED';
      })());
    if (shouldLog) {
      navigation.navigate('ExperienceLog', { activityId: activity.id });
    } else {
      navigation.navigate('ActivityForm', { activityId: activity.id });
    }
  }, [navigation, isToday, now]);

  const nowY = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  // Horizontal swipe to change day
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-50, 50])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationX) > 100) {
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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

      {/* Pull handle */}
      <View style={{ alignItems: 'center', paddingVertical: 6 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#DED6CA' }} />
      </View>

      {/* v2: Tasks moved to bottom bar */}

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
            contentContainerStyle={{ height: TOTAL_CANVAS_HEIGHT + 120 }}
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
                const { top, height } = getActivityPosition(activity.start_time!, activity.duration_minutes);
                const log = logs[activity.id];
                const actStart = parseISO(activity.start_time!);
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
        onPress={() => navigation.navigate('ActivityForm', { date: format(selectedDate, 'yyyy-MM-dd') })}
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
  headerTitle: { color: colors.text, ...type.h1 },
  todayBtn: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'flex-start',
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  todayBtnBar: {
    width: '100%', height: 2, backgroundColor: colors.primary,
  },
  todayBtnDate: {
    color: colors.text, fontSize: 18, fontWeight: '700',
    lineHeight: 22, marginTop: 6,
  },
  searchBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchIcon: { color: colors.muted, fontSize: 24 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  canvasWrapper: { flex: 1 },
  canvas: { flex: 1 },

  timeline: { position: 'relative', width: '100%', height: TOTAL_CANVAS_HEIGHT },

  hourRow: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingLeft: 4,
    height: 0, overflow: 'visible', zIndex: 1,
  },
  hourLabel: {
    color: colors.muted, fontSize: 11, fontWeight: '500' as const,
    width: HOUR_LABEL_WIDTH, textAlign: 'right', marginRight: 6, marginTop: -14,
    opacity: 0.35,
  },
  hourNow: { color: colors.accent, fontWeight: '700', opacity: 1 },
  hourLine: { flex: 1, height: 1, backgroundColor: colors.border, opacity: 0.2 },
  hourLinePast: { opacity: 0.1 },

  nowIndicator: {
    position: 'absolute', left: HOUR_LABEL_WIDTH - 4, right: 0,
    flexDirection: 'row', alignItems: 'center',
    height: 0, overflow: 'visible', zIndex: 10,
  },
  nowDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginTop: -5, marginLeft: -5,
    shadowColor: '#C4795B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10,
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

  fab: {
    position: 'absolute', bottom: 88, right: 20,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.fab,
  },
  fabText: { color: '#fff', fontSize: 22, lineHeight: 24 },
});
