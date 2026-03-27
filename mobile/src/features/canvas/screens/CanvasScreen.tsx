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
import { NetworkBanner } from '../../../components/common/NetworkBanner';
import { Activity } from '../../../types';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

// Build hour labels 00:00-23:00
function buildHourSlots(activities: Activity[], date: Date): { hour: string; items: Activity[] }[] {
  const slots: { hour: string; items: Activity[] }[] = [];
  for (let h = 0; h < 24; h++) {
    const hourStr = `${h.toString().padStart(2, '0')}:00`;
    const items = activities.filter((a) => {
      const start = parseISO(a.start_time);
      return start.getHours() === h && isSameDay(start, date);
    });
    slots.push({ hour: hourStr, items });
  }
  return slots;
}

export function CanvasScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { activities, logs, loading, selectedDate, setSelectedDate, loadDay } = useActivitiesStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<SectionList<any, DefaultSectionT>>(null);

  const load = useCallback(
    (date: Date) => { if (user) loadDay(user.id, date); },
    [user, loadDay]
  );

  useEffect(() => { load(selectedDate); }, [selectedDate]);

  useEffect(() => {
    // Scroll to current hour on mount
    const currentHour = new Date().getHours();
    if (listRef.current && isSameDay(selectedDate, new Date())) {
      setTimeout(() => {
        listRef.current?.scrollToLocation({ sectionIndex: currentHour, itemIndex: 0, animated: true, viewOffset: 80 });
      }, 300);
    }
  }, [activities]);

  const sections = buildHourSlots(activities, selectedDate).map((slot) => ({
    title: slot.hour,
    data: slot.items.length > 0 ? slot.items : ['empty' as const],
    hasItems: slot.items.length > 0,
  }));

  const now = new Date();

  function isNowSlot(hour: string): boolean {
    if (!isSameDay(selectedDate, now)) return false;
    const h = parseInt(hour.split(':')[0]);
    return h === now.getHours();
  }

  type SectionItem = Activity | 'empty';

  function renderItem({ item, section }: { item: SectionItem; section: SectionListData<SectionItem, { title: string; hasItems: boolean }> }) {
    if (item === 'empty') {
      if (!section.hasItems) {
        return (
          <TouchableOpacity
            style={styles.emptySlot}
            onPress={() => navigation.navigate('ActivityForm', { startHour: section.title, date: format(selectedDate, 'yyyy-MM-dd') })}
            accessibilityLabel={`Empty slot at ${section.title}, tap to create activity`}
          >
            <Text style={styles.emptySlotText}>+ Add activity</Text>
          </TouchableOpacity>
        );
      }
      return null;
    }
    const activity = item as Activity;
    const log = logs[activity.id];
    const actStart = parseISO(activity.start_time);
    const actEnd = new Date(actStart.getTime() + activity.duration_minutes * 60000);
    const isCurrentlyActive = isWithinInterval(now, { start: actStart, end: actEnd }) && isSameDay(selectedDate, now);

    return (
      <ActivityCard
        activity={activity}
        log={log}
        isNow={isCurrentlyActive}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
      />
    );
  }

  function renderSectionHeader({ section }: { section: SectionListData<SectionItem, { title: string; hasItems: boolean }> }) {
    const isCurrentHour = isNowSlot(section.title);
    return (
      <View style={[styles.hourRow, isCurrentHour && styles.hourRowNow]}>
        <Text style={[styles.hourLabel, isCurrentHour && styles.hourLabelNow]}>
          {section.title}
        </Text>
        {isCurrentHour && <View style={styles.nowLine} />}
      </View>
    );
  }

  const isToday = isSameDay(selectedDate, now);
  const hasActivities = activities.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <NetworkBanner />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ActivityForm', { date: format(selectedDate, 'yyyy-MM-dd') })}
          accessibilityLabel="Add activity"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#6366F1" size="large" />
        </View>
      ) : !hasActivities ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateEmoji}>📅</Text>
          <Text style={styles.emptyStateTitle}>Plan your first block</Text>
          <Text style={styles.emptyStateBody}>
            Tap the + button or any empty time slot to get started.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateCTA}
            onPress={() => navigation.navigate('ActivityForm', { date: format(selectedDate, 'yyyy-MM-dd') })}
            accessibilityLabel="Plan your first block"
          >
            <Text style={styles.emptyStateCTAText}>Plan a Block</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={listRef as unknown as React.RefObject<SectionList<SectionItem, { title: string; hasItems: boolean }>>}
          sections={sections}
          keyExtractor={(item, index) => (typeof item === 'string' ? `empty-${index}` : item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '800' },
  addButton: {
    backgroundColor: '#6366F1', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '400' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyStateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyStateEmoji: { fontSize: 56, marginBottom: 16 },
  emptyStateTitle: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyStateBody: { color: '#64748B', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyStateCTA: {
    backgroundColor: '#6366F1', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 32, minHeight: 44,
  },
  emptyStateCTAText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listContent: { paddingBottom: 32 },
  hourRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  hourRowNow: {},
  hourLabel: { color: '#334155', fontSize: 12, fontWeight: '600', width: 42 },
  hourLabelNow: { color: '#EF4444' },
  nowLine: { flex: 1, height: 1, backgroundColor: '#EF4444', opacity: 0.5, marginLeft: 8 },
  emptySlot: {
    marginHorizontal: 12, paddingVertical: 8,
    borderRadius: 6, borderWidth: 1, borderColor: '#1E293B',
    borderStyle: 'dashed', alignItems: 'center', minHeight: 44, justifyContent: 'center',
  },
  emptySlotText: { color: '#334155', fontSize: 13 },
});
