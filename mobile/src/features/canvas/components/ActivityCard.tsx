import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Activity, ExperienceLog } from '../../../types';

interface Props {
  activity: Activity;
  log?: ExperienceLog;
  onPress: () => void;
  isNow: boolean;
}

const MOOD_EMOJI = ['', '😫', '😕', '😐', '🙂', '🔥'];
const ENERGY_EMOJI = ['', '🪫', '😴', '⚡', '⚡⚡', '⚡⚡⚡'];

export function ActivityCard({ activity, log, onPress, isNow }: Props) {
  const cat = activity.category;
  const borderColor = cat?.color ?? '#6366F1';
  const heightFactor = Math.max(activity.duration_minutes / 60, 0.5);
  const minHeight = Math.max(56, heightFactor * 60);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: borderColor, minHeight, opacity: activity.status === 'SKIPPED' ? 0.5 : 1 }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`${activity.title}, ${activity.status}, tap to view details`}
      accessibilityRole="button"
    >
      {isNow && <View style={styles.nowIndicator} />}
      <View style={styles.header}>
        <Text style={styles.icon}>{cat?.icon ?? '📋'}</Text>
        <View style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={2}>{activity.title}</Text>
          <Text style={styles.meta}>
            {formatDuration(activity.duration_minutes)}
            {activity.status !== 'PLANNED' && (
              <Text style={[styles.status, statusColor(activity.status)]}> · {statusLabel(activity.status)}</Text>
            )}
          </Text>
        </View>
        {!log && activity.status !== 'SKIPPED' && (
          <View style={styles.logBadge}>
            <Text style={styles.logBadgeText}>Log</Text>
          </View>
        )}
      </View>

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
  nowIndicator: {
    position: 'absolute', top: -1, left: -4, right: 0,
    height: 2, backgroundColor: '#EF4444', borderRadius: 1,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  icon: { fontSize: 18, marginTop: 1 },
  titleArea: { flex: 1 },
  title: { color: '#F1F5F9', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  meta: { color: '#64748B', fontSize: 12 },
  status: { fontWeight: '600' },
  logBadge: {
    backgroundColor: '#312E81', borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  logBadgeText: { color: '#A5B4FC', fontSize: 11, fontWeight: '600' },
  mindset: { color: '#6366F1', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  logRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  logEmoji: { fontSize: 14 },
});
