import React, { useEffect, useRef, useCallback } from 'react';
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

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

interface HourSlot {
  hour: string;
  hourNum: number;
  items: Activity[];
}

function buildHourSlots(activities: Activity[], date: Date): HourSlot[] {
  const slots: HourSlot[] = [];
  for (let h = 6; h < 24; h++) {
    const items = activities.filter((a) => {
      const start = parseISO(a.start_time);
      return start.getHours() === h && isSameDay(start, date);
    });
    slots.push({ hour: formatHour(h), hourNum: h, items });
  }
  return slots;
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

  // Auto-scroll to current hour
  useEffect(() => {
    if (!isSameDay(selectedDate, new Date()) || activities.length === 0) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, (new Date().getHours() - 1) * 52), animated: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [activities]);

  const slots = buildHourSlots(activities, selectedDate);
  const now = new Date();
  const isToday = isSameDay(selectedDate, now);

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
        onPress={(id) => navigation.navigate('ActivityDetail', { activityId: id })}
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
            contentContainerStyle={styles.canvasContent}
            showsVerticalScrollIndicator={false}
          >
            {slots.map((slot) => {
              const isCurrentHour = isToday && slot.hourNum === now.getHours();
              const isPast = isToday && slot.hourNum < now.getHours();
              const hasItems = slot.items.length > 0;

              return (
                <View key={slot.hourNum} style={styles.hourBlock}>
                  {/* Hour row */}
                  <View style={styles.hourRow}>
                    <Text style={[styles.hourLabel, isCurrentHour && styles.hourNow]}>
                      {slot.hour}
                    </Text>
                    {isCurrentHour && <View style={styles.nowDot} />}
                    <View style={[styles.hourLine, isCurrentHour && styles.hourLineNow]} />
                  </View>

                  {/* Cards or empty tap area */}
                  {hasItems ? (
                    slot.items.map((activity) => {
                      const log = logs[activity.id];
                      const actStart = parseISO(activity.start_time);
                      const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
                      const isCurrentlyActive = isWithinInterval(now, { start: actStart, end: actEnd }) && isToday;
                      const isOverdue = activity.status === 'PLANNED' && actStart < now && !isSameDay(actStart, now);
                      return (
                        <View key={activity.id} style={isPast ? { opacity: 0.7 } : undefined}>
                          <ActivityCard
                            activity={activity}
                            log={log}
                            isNow={isCurrentlyActive}
                            isOverdue={isOverdue}
                            onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
                            onQuickComplete={() => quickToggleComplete(activity.id)}
                          />
                        </View>
                      );
                    })
                  ) : (
                    <TouchableOpacity
                      style={styles.emptyTap}
                      onPress={() => navigation.navigate('ActivityForm', { startHour: `${slot.hourNum}:00`, date: format(selectedDate, 'yyyy-MM-dd') })}
                      activeOpacity={0.3}
                    />
                  )}
                </View>
              );
            })}
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

  // Header — minimal
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
  canvasContent: { paddingBottom: 100, paddingTop: 4 },

  // Hour blocks
  hourBlock: { minHeight: 44 },
  hourRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 16, paddingRight: 12,
    height: 24,
  },
  hourLabel: {
    color: colors.muted, fontSize: 12, fontWeight: '600',
    width: 42,
  },
  hourNow: { color: colors.terra, fontWeight: '700' },
  hourLine: { flex: 1, height: 1, backgroundColor: colors.border },
  hourLineNow: { height: 2, backgroundColor: colors.terra, opacity: 0.8 },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.terra, marginRight: 4 },

  // Empty slot — subtle dotted line tap target
  emptyTap: {
    height: 32, marginLeft: 54, marginRight: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border, borderStyle: 'dashed',
    opacity: 0.3,
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
