import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { isBefore, parseISO } from 'date-fns';
import { Activity, ExperienceLog } from '../../../types';

interface Props {
  activity: Activity;
  log?: ExperienceLog;
  onPress: () => void;
  onQuickComplete?: () => void;
  isNow: boolean;
  isOverdue?: boolean;
}

const MOOD_EMOJI = ['', '😫', '😕', '😐', '🙂', '🔥'];
const ENERGY_EMOJI = ['', '🪫', '😴', '⚡', '⚡⚡', '⚡⚡⚡'];

export function ActivityCard({ activity, log, onPress, onQuickComplete, isNow, isOverdue }: Props) {
  const cat = activity.category;
  const borderColor = cat?.color ?? '#6366F1';
  const heightFactor = Math.max(activity.duration_minutes / 60, 0.5);
  const minHeight = Math.max(56, heightFactor * 60);
  const isDone = activity.status === 'COMPLETED';
  const isSkipped = activity.status === 'SKIPPED';
  const subtasksDone = activity.subtasks.filter(s => s.done).length;
  const subtasksTotal = activity.subtasks.length;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: borderColor, minHeight, opacity: isSkipped ? 0.5 : 1 },
        isOverdue && styles.overdueCard,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`${activity.title}, ${activity.status}, tap to view details`}
      accessibilityRole="button"
    >
      {isNow && <View style={styles.nowIndicator} />}
      {isOverdue && (
        <View style={styles.overdueBadge}>
          <Text style={styles.overdueBadgeText}>Overdue</Text>
        </View>
      )}
      <View style={styles.header}>
        {/* Quick complete checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, isDone && styles.checkboxDone]}
          onPress={(e) => {
            e.stopPropagation?.();
            onQuickComplete?.();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={isDone ? 'Mark incomplete' : 'Mark complete'}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
        >
          {isDone && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text style={styles.icon}>{cat?.icon ?? '📋'}</Text>
        <View style={styles.titleArea}>
          <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={2}>{activity.title}</Text>
          <Text style={styles.meta}>
            {formatDuration(activity.duration_minutes)}
            {activity.recurrence_type !== 'NONE' && (
              <Text style={styles.recurrence}> · {recurrenceLabel(activity.recurrence_type, activity.recurrence_days)}</Text>
            )}
            {activity.status !== 'PLANNED' && (
              <Text style={[styles.status, statusColor(activity.status)]}> · {statusLabel(activity.status)}</Text>
            )}
          </Text>
        </View>
        {!log && !isSkipped && !isDone && (
          <View style={styles.logBadge}>
            <Text style={styles.logBadgeText}>Log</Text>
          </View>
        )}
      </View>

      {/* Description preview */}
      {activity.description ? (
        <Text style={styles.description} numberOfLines={1}>{activity.description}</Text>
      ) : null}

      {/* Subtask progress */}
      {subtasksTotal > 0 && (
        <View style={styles.subtaskRow}>
          <View style={styles.subtaskBar}>
            <View style={[styles.subtaskFill, { width: `${(subtasksDone / subtasksTotal) * 100}%` }]} />
          </View>
          <Text style={styles.subtaskText}>{subtasksDone}/{subtasksTotal}</Text>
        </View>
      )}

      {activity.mindset_prompt ? (
        <Text style={styles.mindset} numberOfLines={2}>✨ {activity.mindset_prompt}</Text>
      ) : null}

      {log ? (
        <View style={styles.logRow}>
          <Text style={styles.logEmoji}>{MOOD_EMOJI[log.mood]}</Text>
          <Text style={styles.logEmoji}>{ENERGY_EMOJI[log.energy]}</Text>
          {log.would_repeat === 'YES' && <Text style={styles.logEmoji}>🔁</Text>}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function recurrenceLabel(r: Activity['recurrence_type'], days?: Activity['recurrence_days']): string {
  const labels: Record<string, string> = {
    NONE: '', DAILY: '🔄 Daily', WEEKDAYS: '🔄 Weekdays', WEEKLY: '🔄 Weekly',
    BIWEEKLY: '🔄 Every 2w', TRIWEEKLY: '🔄 Every 3w', MONTHLY: '🔄 Monthly',
    BIMONTHLY: '🔄 2 months', QUARTERLY: '🔄 Quarterly', BIANNUAL: '🔄 6 months',
    YEARLY: '🔄 Yearly',
  };
  let label = labels[r] ?? '';
  if (days && days.length > 0 && (r === 'WEEKLY' || r === 'BIWEEKLY' || r === 'TRIWEEKLY')) {
    label += ` (${days.join(', ')})`;
  }
  return label;
}

function statusLabel(s: Activity['status']): string {
  return { PLANNED: 'Planned', IN_PROGRESS: 'In progress', COMPLETED: 'Done', SKIPPED: 'Skipped' }[s];
}

function statusColor(s: Activity['status']) {
  return {
    PLANNED: { color: '#94A3B8' },
    IN_PROGRESS: { color: '#F59E0B' },
    COMPLETED: { color: '#10B981' },
    SKIPPED: { color: '#475569' },
  }[s];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 2,
    marginHorizontal: 12,
  },
  overdueCard: { borderStyle: 'solid', borderWidth: 1, borderColor: '#EF444444' },
  nowIndicator: {
    position: 'absolute', top: -1, left: -4, right: 0,
    height: 2, backgroundColor: '#EF4444', borderRadius: 1,
  },
  overdueBadge: {
    position: 'absolute', top: 4, right: 8,
    backgroundColor: '#7F1D1D', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  overdueBadgeText: { color: '#FCA5A5', fontSize: 9, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#475569',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  icon: { fontSize: 18, marginTop: 1 },
  titleArea: { flex: 1 },
  title: { color: '#F1F5F9', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  titleDone: { textDecorationLine: 'line-through', color: '#64748B' },
  meta: { color: '#64748B', fontSize: 12 },
  recurrence: { color: '#8B5CF6', fontWeight: '500' },
  status: { fontWeight: '600' },
  logBadge: {
    backgroundColor: '#312E81', borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  logBadgeText: { color: '#A5B4FC', fontSize: 11, fontWeight: '600' },
  description: { color: '#94A3B8', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  subtaskBar: {
    flex: 1, height: 4, backgroundColor: '#0F172A', borderRadius: 2, overflow: 'hidden',
  },
  subtaskFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 2 },
  subtaskText: { color: '#64748B', fontSize: 11, fontWeight: '600', minWidth: 28 },
  mindset: { color: '#6366F1', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  logRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  logEmoji: { fontSize: 14 },
});
