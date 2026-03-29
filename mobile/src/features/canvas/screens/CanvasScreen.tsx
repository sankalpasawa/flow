import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { DateStrip } from '../components/DateStrip';
import { ActivityCard } from '../components/ActivityCard';
import { TaskSection } from '../components/TaskSection';
import { Activity } from '../../../types';
import { colors, shadows, spacing } from '../../../theme';

const HOUR_HEIGHT = 60;
const HOUR_LABEL_WIDTH = 50;
const START_HOUR = 6;
const END_HOUR = 24;
const MIN_BLOCK_HEIGHT = 30;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function getActivityPosition(activity: Activity) {
  const start = parseISO(activity.start_time);
  const startHour = start.getHours();
  const startMinute = start.getMinutes();
  const top = ((startHour - START_HOUR) + startMinute / 60) * HOUR_HEIGHT;
  const height = Math.max((activity.duration_minutes / 60) * HOUR_HEIGHT, MIN_BLOCK_HEIGHT);
  return { top, height };
}

export function CanvasScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { activities, untimedTasks, logs, loading, selectedDate, setSelectedDate, loadDay, quickToggleComplete, addTask } = useActivitiesStore();
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(
    (date: Date) => { if (user) loadDay(user.id, date); },
    [user, loadDay]
  );

  useEffect(() => { load(selectedDate); }, [selectedDate]);

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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.canvas}
            contentContainerStyle={[styles.canvasContent, { height: TOTAL_HEIGHT + 100 }]}
            showsVerticalScrollIndicator={false}
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
                const { top, height } = getActivityPosition(activity);
                const log = logs[activity.id];
                const actStart = parseISO(activity.start_time);
                const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
                const isCurrentlyActive = isToday && isWithinInterval(now, { start: actStart, end: actEnd });
                const isPast = isToday && actEnd < now;
                const isOverdue = activity.status === 'PLANNED' && actStart < now && !isSameDay(actStart, now);

                return (
                  <View
                    key={activity.id}
                    style={[
                      styles.activityBlock,
                      { top, height },
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
    height: TOTAL_HEIGHT,
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
