import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, getCategoryColor, shadows, radii } from '../../../theme';
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

export function ActivityCard({ activity, log, onPress, onQuickComplete, isNow, isOverdue }: Props) {
  const cat = activity.category;
  const catColor = getCategoryColor(activity.category_id);
  const isDone = activity.status === 'COMPLETED';
  const isActive = activity.status === 'IN_PROGRESS';
  const isSkipped = activity.status === 'SKIPPED';
  const subtasksDone = activity.subtasks.filter(s => s.done).length;
  const subtasksTotal = activity.subtasks.length;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: catColor.light, borderLeftColor: catColor.solid },
        isOverdue && styles.overdueCard,
        isSkipped && { opacity: 0.5 },
        shadows.card,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`${activity.title}, ${activity.status}`}
    >
      {isNow && <View style={styles.nowDot} />}
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={2}>
            {activity.title}
          </Text>
          <Text style={styles.meta}>
            {formatDuration(activity.duration_minutes)}
            {activity.recurrence_type !== 'NONE' && (
              <Text style={styles.recurrence}> · {recurrenceLabel(activity.recurrence_type, activity.recurrence_days)}</Text>
            )}
          </Text>
          {cat && (
            <View style={[styles.categoryPill, { backgroundColor: catColor.solid + '18' }]}>
              <Text style={[styles.categoryPillText, { color: catColor.solid }]}>
                {cat.icon} {cat.name}
              </Text>
            </View>
          )}
        </View>

        {/* Status circle */}
        <TouchableOpacity
          style={[
            styles.statusCircle,
            isDone && { backgroundColor: colors.done },
            isActive && { backgroundColor: colors.active },
            !isDone && !isActive && { borderWidth: 2, borderColor: colors.border },
          ]}
          onPress={(e) => { e.stopPropagation?.(); onQuickComplete?.(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={isDone ? 'Mark incomplete' : 'Mark complete'}
        >
          {isDone && <Text style={styles.checkmark}>✓</Text>}
          {isActive && <Text style={styles.activeArrow}>▶</Text>}
        </TouchableOpacity>
      </View>

      {/* Description */}
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

      {/* Mindset prompt */}
      {activity.mindset_prompt ? (
        <View style={styles.mindsetBox}>
          <Text style={styles.mindset} numberOfLines={2}>✨ {activity.mindset_prompt}</Text>
        </View>
      ) : null}

      {/* Log data */}
      {log ? (
        <View style={styles.logRow}>
          <Text style={styles.logEmoji}>{MOOD_EMOJI[log.mood]}</Text>
          {log.would_repeat === 'YES' && <Text style={styles.logEmoji}>🔁</Text>}
        </View>
      ) : !isDone && !isSkipped ? (
        <View style={styles.logBadge}>
          <Text style={styles.logBadgeText}>Log</Text>
        </View>
      ) : null}

      {isOverdue && (
        <View style={styles.overdueBadge}>
          <Text style={styles.overdueBadgeText}>Overdue</Text>
        </View>
      )}
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
    NONE: '', DAILY: 'Daily', WEEKDAYS: 'Weekdays', WEEKLY: 'Weekly',
    BIWEEKLY: 'Every 2w', TRIWEEKLY: 'Every 3w', MONTHLY: 'Monthly',
    BIMONTHLY: '2 months', QUARTERLY: 'Quarterly', BIANNUAL: '6 months', YEARLY: 'Yearly',
  };
  let label = labels[r] ?? '';
  if (days?.length && (r === 'WEEKLY' || r === 'BIWEEKLY' || r === 'TRIWEEKLY')) {
    label += ` (${days.join(', ')})`;
  }
  return label;
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderRadius: radii.card,
    padding: 14,
    marginBottom: 8,
    marginHorizontal: 12,
  },
  overdueCard: { borderWidth: 1, borderColor: colors.danger + '44' },
  nowDot: {
    position: 'absolute', top: -4, left: -8,
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.terra,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  content: { flex: 1, marginRight: 12 },
  title: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  titleDone: { textDecorationLine: 'line-through', color: colors.muted },
  meta: { color: colors.text2, fontSize: 11, marginBottom: 6 },
  recurrence: { color: colors.primary },
  categoryPill: {
    alignSelf: 'flex-start', borderRadius: radii.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  categoryPillText: { fontSize: 10, fontWeight: '500', letterSpacing: 0.3 },
  statusCircle: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  activeArrow: { color: '#fff', fontSize: 9 },
  description: { color: colors.text2, fontSize: 11, marginTop: 6 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  subtaskBar: {
    flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden',
  },
  subtaskFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  subtaskText: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  mindsetBox: {
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  mindset: { color: colors.primaryLight, fontSize: 11, fontStyle: 'italic' },
  logRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  logEmoji: { fontSize: 14 },
  logBadge: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: colors.primaryBg, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  logBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
  overdueBadge: {
    position: 'absolute', bottom: 8, right: 12,
    backgroundColor: colors.dangerLight, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  overdueBadgeText: { color: colors.danger, fontSize: 9, fontWeight: '700' },
});
