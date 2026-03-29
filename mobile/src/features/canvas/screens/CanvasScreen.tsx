import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Platform, RefreshControl, useWindowDimensions,
} from 'react-native';
import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { DateStrip } from '../components/DateStrip';
import { ActivityCard } from '../components/ActivityCard';
import { TaskSection } from '../components/TaskSection';
import { Activity } from '../../../types';
import { colors, shadows, spacing } from '../../../theme';
import {
  HOUR_HEIGHT, START_HOUR, END_HOUR, HOUR_LABEL_WIDTH,
  TOTAL_CANVAS_HEIGHT, getActivityPosition, formatHour,
} from '../../../lib/calendar';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

/**
 * Standard calendar overlap algorithm (Google Calendar / Notion Calendar style).
 * Groups overlapping activities into columns so they render side by side.
 */
function computeOverlapLayout(activities: Activity[]): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>();
  if (activities.length === 0) return result;

  // Parse times once and sort by start, then by duration descending (longer events first)
  const parsed = activities.map((a) => {
    const start = parseISO(a.start_time).getTime();
    const end = start + a.duration_minutes * 60000;
    return { id: a.id, start, end };
  });
  parsed.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Build overlap groups: connected components where any pair overlaps
  const groups: (typeof parsed)[] = [];
  let currentGroup = [parsed[0]];
  let groupEnd = parsed[0].end;

  for (let i = 1; i < parsed.length; i++) {
    const item = parsed[i];
    if (item.start < groupEnd) {
      // Overlaps with the current group
      currentGroup.push(item);
      groupEnd = Math.max(groupEnd, item.end);
    } else {
      groups.push(currentGroup);
      currentGroup = [item];
      groupEnd = item.end;
    }
  }
  groups.push(currentGroup);

  // Assign columns within each group using a greedy approach
  for (const group of groups) {
    const columns: number[] = []; // columns[i] = end time of the last activity in column i
    const assignments = new Map<string, number>();

    for (const item of group) {
      // Find the first column where this activity fits (no overlap)
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
      result.set(item.id, {
        column: assignments.get(item.id)!,
        totalColumns,
      });
    }
  }

  return result;
}

export function CanvasScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { activities, untimedTasks, logs, loading, selectedDate, setSelectedDate, loadDay, quickToggleComplete, addTask } = useActivitiesStore();
  const scrollRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (date: Date) => {
      if (user) await loadDay(user.id, date);
    },
    [user, loadDay]
  );

  useEffect(() => { void load(selectedDate); }, [selectedDate, load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load(selectedDate);
    } finally {
      setRefreshing(false);
    }
  }, [load, selectedDate]);

  // Inject CSS fix for web scroll containment
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'dayflow-scroll-fix';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = '#canvas-wrapper { min-height: 0 !important; flex: 1 1 0% !important; overflow: hidden !important; }';
    document.head.appendChild(style);
  }, []);

  // Auto-scroll to current time
  useEffect(() => {
    if (!isSameDay(selectedDate, new Date())) return;
    const timer = setTimeout(() => {
      const now = new Date();
      const y = ((now.getHours() - START_HOUR) + now.getMinutes() / 60) * HOUR_HEIGHT - 100;
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [activities, selectedDate]);

  const now = new Date();
  const isToday = isSameDay(selectedDate, now);

  // Filter activities for the selected date that have a time
  const timedActivities = useMemo(() =>
    activities.filter((a) => {
      const start = parseISO(a.start_time);
      return isSameDay(start, selectedDate) && start.getHours() >= START_HOUR;
    }),
    [activities, selectedDate]
  );

  // Compute overlap layout for side-by-side rendering
  const overlapLayout = useMemo(
    () => computeOverlapLayout(timedActivities),
    [timedActivities]
  );
  const ACTIVITY_RIGHT_MARGIN = 12;
  const availableWidth = windowWidth - HOUR_LABEL_WIDTH - ACTIVITY_RIGHT_MARGIN;

  // Build hour labels
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = START_HOUR; i < END_HOUR; i++) h.push(i);
    return h;
  }, []);

  // Current time indicator position
  const nowY = isToday
    ? ((now.getHours() - START_HOUR) + now.getMinutes() / 60) * HOUR_HEIGHT
    : -1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
        </Text>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.searchIcon}>⌕</Text>
        </TouchableOpacity>
      </View>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {/* Tasks */}
      <TaskSection
        tasks={untimedTasks}
        todayStr={format(new Date(), 'yyyy-MM-dd')}
        onToggle={(id) => quickToggleComplete(id)}
        onPress={(id) => navigation.navigate('ActivityForm', { activityId: id })}
        onQuickAdd={(title) => {
          if (user) addTask({ user_id: user.id, title, assigned_date: format(selectedDate, 'yyyy-MM-dd') });
        }}
      />

      {/* Canvas */}
      <View nativeID="canvas-wrapper" style={styles.canvasWrapper}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.canvas}
            contentContainerStyle={[styles.canvasContent, { height: TOTAL_CANVAS_HEIGHT + 100 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {/* Timeline container */}
            <View style={styles.timeline}>
              {/* Hour grid lines and labels */}
              {hours.map((h) => {
                const y = (h - START_HOUR) * HOUR_HEIGHT;
                const isCurrentHour = isToday && h === now.getHours();
                return (
                  <View key={h} style={[styles.hourRow, { top: y }]} pointerEvents="none">
                    <Text style={[styles.hourLabel, isCurrentHour && styles.hourNow]}>
                      {formatHour(h)}
                    </Text>
                    <View style={[styles.hourLine, isCurrentHour && styles.hourLineNow]} />
                  </View>
                );
              })}

              {/* Current time indicator */}
              {isToday && nowY >= 0 && (
                <View style={[styles.nowIndicator, { top: nowY }]} pointerEvents="none">
                  <View style={styles.nowDot} />
                  <View style={styles.nowLine} />
                </View>
              )}

              {/* Empty tap areas for each hour (behind activities) */}
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

              {/* Activity blocks */}
              {timedActivities.map((activity) => {
                const { top, height } = getActivityPosition(activity.start_time, activity.duration_minutes);
                const log = logs[activity.id];
                const actStart = parseISO(activity.start_time);
                const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
                const isCurrentlyActive = isToday && isWithinInterval(now, { start: actStart, end: actEnd });
                const isPast = isToday && actEnd < now;
                const isOverdue = activity.status === 'PLANNED' && actStart < now && !isSameDay(actStart, now);

                const layout = overlapLayout.get(activity.id);
                const colWidth = layout ? availableWidth / layout.totalColumns : availableWidth;
                const leftOffset = layout ? HOUR_LABEL_WIDTH + layout.column * colWidth : HOUR_LABEL_WIDTH;

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
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

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

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 2,
  },
  headerTitle: {
    color: colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6,
  },
  searchBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  searchIcon: { color: colors.muted, fontSize: 20 },

  // Canvas
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  canvasWrapper: { flex: 1 },
  canvas: { flex: 1 },
  canvasContent: { paddingTop: 4 },

  // Timeline — relative container for absolute positioning
  timeline: {
    position: 'relative',
    width: '100%',
    height: TOTAL_CANVAS_HEIGHT,
  },

  // Hour grid
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    height: 0,
    overflow: 'visible',
    zIndex: 1,
  },
  hourLabel: {
    color: colors.muted, fontSize: 11, fontWeight: '600',
    width: HOUR_LABEL_WIDTH - 8,
    textAlign: 'right',
    marginRight: 8,
    marginTop: -14,
  },
  hourNow: { color: colors.terra, fontWeight: '700' },
  hourLine: { flex: 1, height: 1, backgroundColor: colors.border },
  hourLineNow: { height: 2, backgroundColor: colors.terra, opacity: 0.8 },

  // Current time indicator
  nowIndicator: {
    position: 'absolute',
    left: HOUR_LABEL_WIDTH - 4,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 0,
    overflow: 'visible',
    zIndex: 10,
  },
  nowDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.terra,
    marginTop: -5,
    marginLeft: -5,
  },
  nowLine: {
    flex: 1, height: 2,
    backgroundColor: colors.terra,
  },

  // Empty tap areas (one per hour slot, behind activities)
  emptyTap: {
    position: 'absolute',
    left: HOUR_LABEL_WIDTH,
    right: 12,
    zIndex: 0,
  },

  // Activity blocks
  activityBlock: {
    position: 'absolute',
    left: HOUR_LABEL_WIDTH,
    right: 12,
    zIndex: 5,
  },

  // FAB
  fab: {
    position: 'absolute', bottom: 88, right: 20,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.fab,
  },
  fabText: { color: '#fff', fontSize: 22, lineHeight: 24 },
});
