import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Platform,
} from 'react-native';
import { format, parseISO, addMinutes } from 'date-fns';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { Activity } from '../../../types';
import { isEditWindowOpen } from '../../../lib/db/logs';

interface Props {
  route: { params?: { activityId?: string } };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

const STATUS_TRANSITIONS: Record<Activity['status'], Activity['status'][]> = {
  PLANNED: ['IN_PROGRESS', 'SKIPPED'],
  IN_PROGRESS: ['COMPLETED', 'SKIPPED'],
  COMPLETED: [],
  SKIPPED: ['IN_PROGRESS'],
};

const STATUS_LABELS: Record<Activity['status'], string> = {
  PLANNED: 'Mark In Progress',
  IN_PROGRESS: 'Mark Complete',
  COMPLETED: '',
  SKIPPED: 'Resume',
};

export function ActivityDetailScreen({ route, navigation }: Props) {
  const activityId = route.params?.activityId ?? '';
  const { activities, untimedTasks, logs, removeActivity, setActivityStatus } = useActivitiesStore();
  const activity = activities.find((a) => a.id === activityId) || untimedTasks.find((a) => a.id === activityId);
  const log = logs[activityId];

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: '#1A1A1A', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Activity not found</Text>
          <Text style={{ color: '#9A9490', fontSize: 14, marginBottom: 20 }}>This activity may have been deleted.</Text>
          <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryActionText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const endTime = addMinutes(parseISO(activity.start_time), activity.duration_minutes);
  const canLog = isEditWindowOpen(endTime) && !log;
  const canEditLog = log && isEditWindowOpen(endTime);
  const nextStatus = STATUS_TRANSITIONS[activity.status][0];

  async function handleDelete() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Delete "${activity!.title}"? This cannot be undone.`)
      : await new Promise<boolean>((resolve) => {
          const { Alert } = require('react-native');
          Alert.alert(
            'Delete Activity',
            `Delete "${activity!.title}"? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });
    if (!confirmed) return;
    try {
      await removeActivity(activityId);
      navigation.goBack();
    } catch (err) {
      console.error('[DayFlow] Failed to delete activity:', err);
    }
  }

  async function handleStatusChange(newStatus: Activity['status']) {
    try {
      await setActivityStatus(activityId, newStatus);
    } catch (err) {
      console.error('[DayFlow] Failed to update status:', err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.catBadge}>
          <Text style={styles.catIcon}>{activity.category?.icon ?? '📋'}</Text>
          <Text style={[styles.catName, { color: activity.category?.color ?? '#6366F1' }]}>
            {activity.category?.name ?? 'Uncategorized'}
          </Text>
        </View>

        <Text style={styles.title}>{activity.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {format(parseISO(activity.start_time), 'h:mm a')} – {format(endTime, 'h:mm a')}
          </Text>
          <Text style={styles.metaSep}>·</Text>
          <Text style={styles.meta}>{activity.duration_minutes}m</Text>
          <Text style={styles.metaSep}>·</Text>
          <Text style={[styles.statusBadge, statusColor(activity.status)]}>
            {activity.status}
          </Text>
        </View>

        {activity.mindset_prompt ? (
          <View style={styles.mindsetBox}>
            <Text style={styles.mindsetLabel}>✨ Mindset</Text>
            <Text style={styles.mindsetText}>{activity.mindset_prompt}</Text>
          </View>
        ) : null}

        {/* Status action */}
        {nextStatus ? (
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => handleStatusChange(nextStatus)}
            accessibilityLabel={STATUS_LABELS[activity.status]}
          >
            <Text style={styles.primaryActionText}>{STATUS_LABELS[activity.status]}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Log button */}
        {canLog && (
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => navigation.navigate('LogForm', { activityId })}
            accessibilityLabel="Log experience"
          >
            <Text style={styles.logButtonText}>📝 Log Experience</Text>
          </TouchableOpacity>
        )}

        {/* Existing log */}
        {log && (
          <View style={styles.logCard}>
            <Text style={styles.logTitle}>Experience Log</Text>
            <View style={styles.logScales}>
              <View style={styles.scaleItem}>
                <Text style={styles.scaleLabel}>Mood</Text>
                <Text style={styles.scaleEmoji}>{['', '😫', '😕', '😐', '🙂', '🔥'][log.mood]}</Text>
                <Text style={styles.scaleValue}>{log.mood}/5</Text>
              </View>
              <View style={styles.scaleItem}>
                <Text style={styles.scaleLabel}>Energy</Text>
                <Text style={styles.scaleEmoji}>{['', '🪫', '😴', '⚡', '⚡⚡', '⚡⚡⚡'][log.energy]}</Text>
                <Text style={styles.scaleValue}>{log.energy}/5</Text>
              </View>
              <View style={styles.scaleItem}>
                <Text style={styles.scaleLabel}>Done</Text>
                <Text style={styles.scaleValue}>{log.completion_pct}%</Text>
              </View>
            </View>
            {log.reflection ? <Text style={styles.reflection}>"{log.reflection}"</Text> : null}
            {log.would_repeat && (
              <Text style={styles.wouldRepeat}>
                Would repeat: <Text style={styles.wouldRepeatVal}>{log.would_repeat}</Text>
              </Text>
            )}
            {canEditLog && (
              <TouchableOpacity
                style={styles.editLogButton}
                onPress={() => navigation.navigate('LogForm', { activityId, editMode: true })}
                accessibilityLabel="Edit log"
              >
                <Text style={styles.editLogText}>Edit Log</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Edit & Delete */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('ActivityForm', { activityId })}
            accessibilityLabel="Edit activity"
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            accessibilityLabel="Delete activity"
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  content: { padding: 20, paddingBottom: 48 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  catIcon: { fontSize: 18 },
  catName: { fontSize: 14, fontWeight: '600' },
  title: { color: '#1A1A1A', fontSize: 24, fontWeight: '700', marginBottom: 12, lineHeight: 30 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  meta: { color: '#5A5550', fontSize: 14 },
  metaSep: { color: '#EDE8E1' },
  statusBadge: { fontSize: 12, fontWeight: '700' },
  mindsetBox: { backgroundColor: '#EBF2EE', borderRadius: 14, padding: 14, marginBottom: 20 },
  mindsetLabel: { color: '#2D4A3E', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  mindsetText: { color: '#3D6454', fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  primaryAction: {
    backgroundColor: '#2D4A3E', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center', marginBottom: 12, minHeight: 44,
  },
  primaryActionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logButton: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#2D4A3E',
    paddingVertical: 14, alignItems: 'center', marginBottom: 20, minHeight: 44,
  },
  logButtonText: { color: '#2D4A3E', fontSize: 16, fontWeight: '600' },
  logCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#EDE8E1' },
  logTitle: { color: '#9A9490', fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  logScales: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  scaleItem: { alignItems: 'center' },
  scaleLabel: { color: '#9A9490', fontSize: 11, marginBottom: 4 },
  scaleEmoji: { fontSize: 20, marginBottom: 2 },
  scaleValue: { color: '#5A5550', fontSize: 13, fontWeight: '600' },
  reflection: { color: '#5A5550', fontSize: 14, fontStyle: 'italic', marginBottom: 8, lineHeight: 20 },
  wouldRepeat: { color: '#9A9490', fontSize: 13 },
  wouldRepeatVal: { color: '#1A1A1A', fontWeight: '600' },
  editLogButton: {
    marginTop: 12, paddingVertical: 8, alignItems: 'center', minHeight: 44, justifyContent: 'center',
  },
  editLogText: { color: '#2D4A3E', fontSize: 14, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12 },
  editButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#EDE8E1',
    paddingVertical: 12, alignItems: 'center', minHeight: 44,
  },
  editButtonText: { color: '#5A5550', fontSize: 15, fontWeight: '600' },
  deleteButton: {
    flex: 1, backgroundColor: '#FFE4E1', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', minHeight: 44,
  },
  deleteButtonText: { color: '#E53E3E', fontSize: 15, fontWeight: '600' },
});
