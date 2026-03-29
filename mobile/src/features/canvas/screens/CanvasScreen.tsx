import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Platform, RefreshControl, useWindowDimensions,
  NativeSyntheticEvent, NativeScrollEvent, InteractionManager,
} from 'react-native';
import { format, isSameDay, isWithinInterval, parseISO, addDays, subDays } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { getActivitiesForDay } from '../../../lib/db/activities';
import { DateStrip } from '../components/DateStrip';
import { ActivityCard } from '../components/ActivityCard';
import { TaskSection } from '../components/TaskSection';
import { Activity } from '../../../types';
import { colors, shadows, spacing, type } from '../../../theme';
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
  const [prevDayActivities, setPrevDayActivities] = useState<Activity[]>([]);
  const [nextDayActivities, setNextDayActivities] = useState<Activity[]>([]);
  const isResettingScroll = useRef(false);
  // Track whether we're in a seamless day transition (skip loading spinner)
  const isSeamlessTransition = useRef(false);
  // Cache for pre-fetched adjacent day data keyed by date string
  const adjacentCache = useRef<Record<string, Activity[]>>({});

  /** Full load: fetches center day via store + adjacent days for the 3-day window */
  const load = useCallback(
    async (date: Date, seamless = false) => {
      if (!user) return;
      if (seamless) {
        isSeamlessTransition.current = true;
      }
      await loadDay(user.id, date);
      // Load adjacent days for infinite scroll
      const prevDate = subDays(date, 1);
      const nextDate = addDays(date, 1);
      const prevKey = format(prevDate, 'yyyy-MM-dd');
      const nextKey = format(nextDate, 'yyyy-MM-dd');

      // Use cached data if available (pre-fetched), otherwise fetch
      const prevCached = adjacentCache.current[prevKey];
      const nextCached = adjacentCache.current[nextKey];

      const [prev, next] = await Promise.all([
        prevCached ? Promise.resolve(prevCached) : getActivitiesForDay(user.id, prevKey),
        nextCached ? Promise.resolve(nextCached) : getActivitiesForDay(user.id, nextKey),
      ]);
      setPrevDayActivities(prev);
      setNextDayActivities(next);

      // Pre-fetch the outer adjacent days (day-2 and day+2) so they're ready
      // when the user scrolls again
      const outerPrevKey = format(subDays(date, 2), 'yyyy-MM-dd');
      const outerNextKey = format(addDays(date, 2), 'yyyy-MM-dd');
      Promise.all([
        getActivitiesForDay(user.id, outerPrevKey),
        getActivitiesForDay(user.id, outerNextKey),
      ]).then(([outerPrev, outerNext]) => {
        adjacentCache.current[outerPrevKey] = outerPrev;
        adjacentCache.current[outerNextKey] = outerNext;
      }).catch(() => { /* pre-fetch is best-effort */ });

      // Store the fetched adjacent data in cache for future transitions
      adjacentCache.current[prevKey] = prev;
      adjacentCache.current[nextKey] = next;

      if (seamless) {
        isSeamlessTransition.current = false;
      }
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

  // Auto-scroll to center day on mount and explicit date changes (DateStrip tap).
  // During seamless transitions the scroll handler already repositioned — skip.
  const lastScrolledDate = useRef<string>('');
  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    // Skip if this render was triggered by a seamless boundary transition —
    // the scroll position was already set by the scroll handler.
    if (isSeamlessTransition.current) {
      lastScrolledDate.current = dateKey;
      return;
    }
    // Also skip if we already scrolled to this date (avoids double-fire from
    // activities array updating after loadDay resolves)
    if (lastScrolledDate.current === dateKey && !refreshing) return;
    lastScrolledDate.current = dateKey;

    const timer = setTimeout(() => {
      isResettingScroll.current = true;
      const centerOffset = TOTAL_CANVAS_HEIGHT; // skip prev day section
      if (isSameDay(selectedDate, new Date())) {
        const now = new Date();
        const timeOffset = ((now.getHours() - START_HOUR) + now.getMinutes() / 60) * HOUR_HEIGHT - 100;
        scrollRef.current?.scrollTo({ y: centerOffset + Math.max(0, timeOffset), animated: false });
      } else {
        scrollRef.current?.scrollTo({ y: centerOffset, animated: false });
      }
      // Allow boundary detection after scroll reset settles
      setTimeout(() => { isResettingScroll.current = false; }, 200);
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedDate, refreshing]);

  const now = new Date();
  const isToday = isSameDay(selectedDate, now);

  // Debounce timer ref for boundary detection
  const boundaryDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => { if (boundaryDebounce.current) clearTimeout(boundaryDebounce.current); };
  }, []);

  // Boundary detection on scroll — debounced + deferred to avoid mid-scroll jank.
  // Instead of calling setSelectedDate (which triggers loading spinner + full re-render),
  // we: (1) reset scroll to center, (2) shift the 3-day data window using pre-loaded data,
  // (3) defer the actual date update via InteractionManager so the frame stays smooth.
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isResettingScroll.current) return;
    const scrollY = e.nativeEvent.contentOffset.y;

    const crossedTop = scrollY < TOTAL_CANVAS_HEIGHT * 0.3;
    const crossedBottom = scrollY > TOTAL_CANVAS_HEIGHT * 1.7;

    if (!crossedTop && !crossedBottom) {
      // Clear any pending boundary transition if user scrolled back to safe zone
      if (boundaryDebounce.current) {
        clearTimeout(boundaryDebounce.current);
        boundaryDebounce.current = null;
      }
      return;
    }

    // Already have a pending transition — don't stack another
    if (boundaryDebounce.current) return;

    boundaryDebounce.current = setTimeout(() => {
      boundaryDebounce.current = null;
      isResettingScroll.current = true;

      const direction = crossedTop ? -1 : 1;
      const newDate = direction === -1 ? subDays(selectedDate, 1) : addDays(selectedDate, 1);

      // 1. Immediately reset scroll to center so there's no visible jump
      const centerOffset = TOTAL_CANVAS_HEIGHT;
      scrollRef.current?.scrollTo({ y: centerOffset, animated: false });

      // 2. Defer the date/data update until after the scroll reset paints
      InteractionManager.runAfterInteractions(() => {
        // Shift the 3-day window: reuse already-loaded data for the overlap
        if (direction === -1) {
          // Scrolled to previous day — prev becomes center, center becomes next
          setNextDayActivities([...activities]);
        } else {
          // Scrolled to next day — next becomes center, center becomes prev
          setPrevDayActivities([...activities]);
        }
        setSelectedDate(newDate);
        // Load with seamless flag to skip showing the loading spinner
        void load(newDate, true);

        // Re-enable boundary detection after the transition settles
        requestAnimationFrame(() => {
          setTimeout(() => {
            isResettingScroll.current = false;
          }, 150);
        });
      });
    }, 100); // 100ms debounce — lets fast flick scrolls settle before committing
  }, [selectedDate, setSelectedDate, activities, load]);

  // 3-day window dates
  const prevDate = useMemo(() => subDays(selectedDate, 1), [selectedDate]);
  const nextDate = useMemo(() => addDays(selectedDate, 1), [selectedDate]);

  // Filter timed activities for each day
  const filterTimedForDay = useCallback((acts: Activity[], date: Date) =>
    acts.filter((a) => {
      const start = parseISO(a.start_time);
      return isSameDay(start, date) && start.getHours() >= START_HOUR;
    }),
    []
  );

  const timedActivities = useMemo(() => filterTimedForDay(activities, selectedDate), [activities, selectedDate, filterTimedForDay]);
  const prevTimedActivities = useMemo(() => filterTimedForDay(prevDayActivities, prevDate), [prevDayActivities, prevDate, filterTimedForDay]);
  const nextTimedActivities = useMemo(() => filterTimedForDay(nextDayActivities, nextDate), [nextDayActivities, nextDate, filterTimedForDay]);

  // Compute overlap layouts for each day
  const overlapLayout = useMemo(() => computeOverlapLayout(timedActivities), [timedActivities]);
  const prevOverlapLayout = useMemo(() => computeOverlapLayout(prevTimedActivities), [prevTimedActivities]);
  const nextOverlapLayout = useMemo(() => computeOverlapLayout(nextTimedActivities), [nextTimedActivities]);

  const ACTIVITY_RIGHT_MARGIN = 12;
  const availableWidth = windowWidth - HOUR_LABEL_WIDTH - ACTIVITY_RIGHT_MARGIN;

  // Build hour labels
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = START_HOUR; i < END_HOUR; i++) h.push(i);
    return h;
  }, []);

  // Current time indicator position (shown in whichever section is today)
  const nowY = ((now.getHours() - START_HOUR) + now.getMinutes() / 60) * HOUR_HEIGHT;

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

      {/* Canvas — 3-day infinite scroll */}
      <View nativeID="canvas-wrapper" style={styles.canvasWrapper}>
        {loading && !refreshing && !isSeamlessTransition.current ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.canvas}
            contentContainerStyle={[styles.canvasContent, { height: TOTAL_CANVAS_HEIGHT * 3 + 100 }]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={64}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            {/* Day sections: prev, current, next */}
            {([
              { date: prevDate, dayActivities: prevTimedActivities, layout: prevOverlapLayout, key: 'prev' },
              { date: selectedDate, dayActivities: timedActivities, layout: overlapLayout, key: 'current' },
              { date: nextDate, dayActivities: nextTimedActivities, layout: nextOverlapLayout, key: 'next' },
            ] as const).map(({ date: sectionDate, dayActivities: sectionActivities, layout: sectionLayout, key: sectionKey }, sectionIndex) => {
              const isSectionToday = isSameDay(sectionDate, now);
              return (
                <View key={sectionKey} style={{ height: TOTAL_CANVAS_HEIGHT }}>
                  {/* Day separator */}
                  {sectionIndex > 0 && (
                    <View style={styles.daySeparator} pointerEvents="none">
                      <View style={styles.daySeparatorLine} />
                      <Text style={styles.daySeparatorLabel}>
                        {isSectionToday ? 'Today' : format(sectionDate, 'EEE, MMM d')}
                      </Text>
                      <View style={styles.daySeparatorLine} />
                    </View>
                  )}

                  {/* Timeline container */}
                  <View style={styles.timeline}>
                    {/* Hour grid lines and labels */}
                    {hours.map((h) => {
                      const y = (h - START_HOUR) * HOUR_HEIGHT;
                      const isCurrentHour = isSectionToday && h === now.getHours();
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
                    {isSectionToday && nowY >= 0 && (
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
                          key={`empty-${sectionKey}-${h}`}
                          style={[styles.emptyTap, { top: y, height: HOUR_HEIGHT }]}
                          onPress={() => navigation.navigate('ActivityForm', { startHour: `${h}:00`, date: format(sectionDate, 'yyyy-MM-dd') })}
                          activeOpacity={0.3}
                        />
                      );
                    })}

                    {/* Activity blocks */}
                    {sectionActivities.map((activity) => {
                      const { top, height } = getActivityPosition(activity.start_time, activity.duration_minutes);
                      const log = logs[activity.id];
                      const actStart = parseISO(activity.start_time);
                      const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
                      const isCurrentlyActive = isSectionToday && isWithinInterval(now, { start: actStart, end: actEnd });
                      const isPast = isSectionToday && actEnd < now;
                      const isOverdue = activity.status === 'PLANNED' && actStart < now && !isSameDay(actStart, now);

                      const itemLayout = sectionLayout.get(activity.id);
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
                          />
                        </View>
                      );
                    })}
                  </View>
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

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 2,
  },
  headerTitle: {
    color: colors.text, ...type.h1,
  },
  searchBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  searchIcon: { color: colors.muted, fontSize: 24 },

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
    color: colors.muted, ...type.caption,
    width: HOUR_LABEL_WIDTH - 8,
    textAlign: 'right',
    marginRight: 8,
    marginTop: -14,
  },
  hourNow: { color: colors.terra, fontWeight: '700' },
  hourLine: { flex: 1, height: 1, backgroundColor: colors.border },
  hourLineNow: { height: 2, backgroundColor: colors.terra, opacity: 0.8 },

  // Day separator between sections
  daySeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  daySeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.muted,
    opacity: 0.3,
  },
  daySeparatorLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 8,
  },

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
