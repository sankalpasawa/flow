import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, SectionListData, DefaultSectionT,
} from 'react-native';
import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { DateStrip } from '../components/DateStrip';
import { ActivityCard } from '../components/ActivityCard';
import { TaskSection } from '../components/TaskSection';
import { Activity } from '../../../types';
import { colors, radii, shadows, spacing } from '../../../theme';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

function formatHour12(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function buildHourSlots(activities: Activity[], date: Date): { hour: string; hourNum: number; items: Activity[] }[] {
  const slots: { hour: string; hourNum: number; items: Activity[] }[] = [];
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
  const listRef = useRef<SectionList<any, DefaultSectionT>>(null);

  const load = useCallback(
    (date: Date) => { if (user) loadDay(user.id, date); },
    [user, loadDay]
  );

  useEffect(() => { load(selectedDate); }, [selectedDate]);

  useEffect(() => {
    if (!isSameDay(selectedDate, new Date()) || activities.length === 0) return;
    const currentHour = new Date().getHours();
    const timer = setTimeout(() => {
      try {
        listRef.current?.scrollToLocation({ sectionIndex: currentHour, itemIndex: 0, animated: true, viewOffset: 80 });
      } catch {}
      try {
        if (typeof document !== 'undefined') {
          const scrollables = Array.from(document.querySelectorAll('div')).filter((el: HTMLElement) => {
            const s = window.getComputedStyle(el);
            return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
          });
          if (scrollables.length > 0) scrollables[0].scrollTop = currentHour * 80;
        }
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [activities]);

  const sections = buildHourSlots(activities, selectedDate).map((slot) => ({
    title: slot.hour,
    hourNum: slot.hourNum,
    data: slot.items.length > 0 ? slot.items : ['empty' as const],
    hasItems: slot.items.length > 0,
  }));

  const now = new Date();
  const isToday = isSameDay(selectedDate, now);
  const activityCount = activities.length;
  const taskCount = untimedTasks.filter(t => t.status !== 'COMPLETED').length;

  type SectionItem = Activity | 'empty';

  function renderItem({ item, section }: { item: SectionItem; section: SectionListData<SectionItem, { title: string; hasItems: boolean }> }) {
    if (item === 'empty') {
      if (!section.hasItems) {
        return (
          <TouchableOpacity
            style={styles.emptySlot}
            onPress={() => navigation.navigate('ActivityForm', { startHour: section.title, date: format(selectedDate, 'yyyy-MM-dd') })}
            accessibilityLabel={`Empty slot at ${section.title}`}
          >
            <Text style={styles.emptySlotText}>+</Text>
          </TouchableOpacity>
        );
      }
      return null;
    }
    const activity = item as Activity;
    const log = logs[activity.id];
    const actStart = parseISO(activity.start_time);
    const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
    const isCurrentlyActive = isWithinInterval(now, { start: actStart, end: actEnd }) && isToday;
    const actDate = parseISO(activity.start_time);
    const isOverdue = activity.status === 'PLANNED' && actDate < now && !isSameDay(actDate, now);

    return (
      <ActivityCard
        activity={activity}
        log={log}
        isNow={isCurrentlyActive}
        isOverdue={isOverdue}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
        onQuickComplete={() => quickToggleComplete(activity.id)}
      />
    );
  }

  function renderSectionHeader({ section }: { section: SectionListData<SectionItem, { title: string; hourNum: number; hasItems: boolean }> }) {
    const isCurrentHour = isToday && (section as any).hourNum === now.getHours();
    return (
      <View style={styles.hourRow}>
        <Text style={[styles.hourLabel, isCurrentHour && styles.hourLabelNow]}>
          {section.title}
        </Text>
        {isCurrentHour && (
          <>
            <View style={styles.nowDot} />
            <View style={styles.nowLine} />
          </>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isToday ? format(now, 'EEEE') : format(selectedDate, 'EEEE')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {format(selectedDate, 'MMMM d')}{activityCount > 0 ? ` — ${activityCount} blocks` : ''}{taskCount > 0 ? `, ${taskCount} tasks` : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Search')}
            accessibilityLabel="Search"
          >
            <Text style={styles.iconButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <SectionList
          ref={listRef as any}
          sections={sections}
          keyExtractor={(item, index) => (typeof item === 'string' ? `empty-${index}` : item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <TaskSection
              tasks={untimedTasks}
              todayStr={format(new Date(), 'yyyy-MM-dd')}
              onToggle={(id) => quickToggleComplete(id)}
              onPress={(id) => navigation.navigate('ActivityDetail', { activityId: id })}
              onQuickAdd={(title) => {
                if (user) addTask({ user_id: user.id, title, assigned_date: format(selectedDate, 'yyyy-MM-dd') });
              }}
            />
          }
        />
      )}

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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 12,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '600' },
  headerSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  iconButtonText: { fontSize: 18 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 100 },
  hourRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.screen, paddingTop: 12, paddingBottom: 4,
  },
  hourLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', width: 42 },
  hourLabelNow: { color: colors.terra, fontWeight: '700' },
  nowDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.terra, marginRight: 4,
  },
  nowLine: { flex: 1, height: 1.5, backgroundColor: colors.terra, opacity: 0.5 },
  emptySlot: {
    marginHorizontal: 12, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    minHeight: 48,
  },
  emptySlotText: { color: colors.muted, fontSize: 18 },
  fab: {
    position: 'absolute', bottom: 96, right: 24,
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 28 },
});
