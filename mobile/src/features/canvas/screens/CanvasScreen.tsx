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

function formatHour12(h: number): string {
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
  for (let h = 0; h < 24; h++) {
    const items = activities.filter((a) => {
      const start = parseISO(a.start_time);
      return start.getHours() === h && isSameDay(start, date);
    });
    slots.push({ hour: formatHour12(h), hourNum: h, items });
  }
  return slots;
}

export function CanvasScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { activities, untimedTasks, logs, loading, selectedDate, setSelectedDate, loadDay, quickToggleComplete, addTask } = useActivitiesStore();
  const scrollRef = useRef<ScrollView>(null);

  // Fix react-native-web ScrollView: intermediate wrapper divs don't get
  // minHeight:0, so the ScrollView grows to content instead of constraining.
  // Inject a one-time CSS rule to fix this globally.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    const id = 'dayflow-scroll-fix';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = '#canvas-wrapper { min-height: 0 !important; flex: 1 1 0% !important; overflow: hidden !important; } #canvas-wrapper > div { min-height: 0 !important; flex: 1 1 0% !important; }';
    document.head.appendChild(style);
  }, []);

  const load = useCallback(
    (date: Date) => { if (user) loadDay(user.id, date); },
    [user, loadDay]
  );

  useEffect(() => { load(selectedDate); }, [selectedDate]);

  // Auto-scroll to current hour on load
  useEffect(() => {
    if (!isSameDay(selectedDate, new Date()) || activities.length === 0) return;
    const currentHour = new Date().getHours();
    const timer = setTimeout(() => {
      // Each hour row is ~60px tall on average
      scrollRef.current?.scrollTo({ y: Math.max(0, (currentHour - 1) * 60), animated: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [activities]);

  const slots = buildHourSlots(activities, selectedDate);

  const now = new Date();
  const isToday = isSameDay(selectedDate, now);
  const activityCount = activities.length;
  const taskCount = untimedTasks.filter(t => t.status !== 'COMPLETED').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Pinned header */}
      <View style={styles.pinnedSection}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {isToday ? 'Today' : format(selectedDate, 'EEEE')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {format(selectedDate, 'MMMM d')}{activityCount > 0 ? ` · ${activityCount} blocks` : ''}{taskCount > 0 ? ` · ${taskCount} tasks` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Search')}
            accessibilityLabel="Search"
          >
            <Text style={styles.iconButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        <TaskSection
          tasks={untimedTasks}
          todayStr={format(new Date(), 'yyyy-MM-dd')}
          onToggle={(id) => quickToggleComplete(id)}
          onPress={(id) => navigation.navigate('ActivityDetail', { activityId: id })}
          onQuickAdd={(title) => {
            if (user) addTask({ user_id: user.id, title, assigned_date: format(selectedDate, 'yyyy-MM-dd') });
          }}
        />
      </View>

      {/* Scrollable hourly canvas */}
      <View nativeID="canvas-wrapper" style={styles.canvasWrapper}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.canvasScroll}
          contentContainerStyle={styles.canvasContent}
          showsVerticalScrollIndicator={false}
        >
          {slots.map((slot) => {
            const isCurrentHour = isToday && slot.hourNum === now.getHours();
            const hasItems = slot.items.length > 0;

            return (
              <View key={slot.hourNum}>
                {/* Hour label row */}
                <View style={styles.hourRow}>
                  <Text style={[styles.hourLabel, isCurrentHour && styles.hourLabelNow]}>
                    {slot.hour}
                  </Text>
                  {isCurrentHour ? (
                    <>
                      <View style={styles.nowDot} />
                      <View style={styles.nowLine} />
                    </>
                  ) : (
                    <View style={styles.hourLine} />
                  )}
                </View>

                {/* Activity cards for this hour */}
                {hasItems ? (
                  slot.items.map((activity) => {
                    const log = logs[activity.id];
                    const actStart = parseISO(activity.start_time);
                    const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
                    const isCurrentlyActive = isWithinInterval(now, { start: actStart, end: actEnd }) && isToday;
                    const actDate = parseISO(activity.start_time);
                    const isOverdue = activity.status === 'PLANNED' && actDate < now && !isSameDay(actDate, now);
                    return (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        log={log}
                        isNow={isCurrentlyActive}
                        isOverdue={isOverdue}
                        onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
                        onQuickComplete={() => quickToggleComplete(activity.id)}
                      />
                    );
                  })
                ) : (
                  <TouchableOpacity
                    style={styles.emptySlot}
                    onPress={() => navigation.navigate('ActivityForm', { startHour: slot.hour, date: format(selectedDate, 'yyyy-MM-dd') })}
                    accessibilityLabel={`Add activity at ${slot.hour}`}
                    activeOpacity={0.5}
                  >
                    <Text style={styles.emptySlotText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, shadows.fab]}
        onPress={() => navigation.navigate('ActivityForm', { date: format(selectedDate, 'yyyy-MM-dd') })}
        accessibilityLabel="Add activity"
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pinnedSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexShrink: 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 10, paddingBottom: 2,
  },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: '700' },
  headerSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  iconButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  iconButtonText: { fontSize: 16 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  canvasWrapper: { flex: 1 },
  canvasScroll: { flex: 1 },
  canvasContent: { paddingBottom: 120, paddingTop: 8 },
  hourRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: spacing.screen, paddingRight: spacing.md,
    height: 28,
  },
  hourLabel: {
    color: colors.muted, fontSize: 11, fontWeight: '500',
    width: 42, letterSpacing: 0.2,
  },
  hourLabelNow: { color: colors.terra, fontWeight: '700' },
  hourLine: {
    flex: 1, height: 0.5, backgroundColor: colors.border,
  },
  nowDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.terra, marginRight: 4,
  },
  nowLine: { flex: 1, height: 1.5, backgroundColor: colors.terra, opacity: 0.6 },
  emptySlot: {
    marginLeft: 66, marginRight: spacing.screen,
    paddingVertical: 6,
    alignItems: 'flex-start',
    minHeight: 28,
  },
  emptySlotText: { color: colors.border, fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 96, right: 24,
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 24, lineHeight: 26 },
});
