import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { getLogsForUser } from '../../../lib/db/logs';
import { ExperienceLog } from '../../../types';
import { NetworkBanner } from '../../../components/common/NetworkBanner';

const MOOD_EMOJI = ['', '😫', '😕', '😐', '🙂', '🔥'];
const ENERGY_EMOJI = ['', '🪫', '😴', '⚡', '⚡⚡', '⚡⚡⚡'];

interface LogWithActivity extends ExperienceLog {
  activity_title?: string;
}

export function LogHistoryScreen() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<LogWithActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getLogsForUser(user.id)
      .then(setLogs)
      .catch((err) => {
        console.error('[DayFlow] Failed to load log history:', err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#2D4A3E" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (logs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <NetworkBanner />
        <View style={styles.header}><Text style={styles.headerTitle}>Log History</Text></View>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📓</Text>
          <Text style={styles.emptyTitle}>No logs yet</Text>
          <Text style={styles.emptyBody}>Complete an activity and log your experience to start building your history.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NetworkBanner />
      <View style={styles.header}><Text style={styles.headerTitle}>Log History</Text></View>
      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logActivity} numberOfLines={1}>
                {(item as LogWithActivity).activity_title ?? 'Unknown Activity'}
              </Text>
              <Text style={styles.logDate}>
                {format(parseISO(item.logged_at), 'MMM d, h:mm a')}
              </Text>
            </View>
            <View style={styles.scalesRow}>
              <View style={styles.scale}>
                <Text style={styles.scaleLabel}>Mood</Text>
                <Text style={styles.scaleEmoji}>{MOOD_EMOJI[item.mood]}</Text>
                <Text style={styles.scaleNum}>{item.mood}/5</Text>
              </View>
              <View style={styles.scale}>
                <Text style={styles.scaleLabel}>Energy</Text>
                <Text style={styles.scaleEmoji}>{ENERGY_EMOJI[item.energy]}</Text>
                <Text style={styles.scaleNum}>{item.energy}/5</Text>
              </View>
              <View style={styles.scale}>
                <Text style={styles.scaleLabel}>Done</Text>
                <Text style={styles.scaleNum}>{item.completion_pct}%</Text>
              </View>
              {item.would_repeat && (
                <View style={styles.scale}>
                  <Text style={styles.scaleLabel}>Repeat</Text>
                  <Text style={styles.scaleNum}>{item.would_repeat}</Text>
                </View>
              )}
            </View>
            {item.reflection ? (
              <Text style={styles.reflection} numberOfLines={3}>"{item.reflection}"</Text>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { color: '#1A1A1A', fontSize: 22, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#1A1A1A', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: '#9A9490', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  listContent: { padding: 16, gap: 12 },
  logCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  logActivity: { color: '#1A1A1A', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  logDate: { color: '#9A9490', fontSize: 12 },
  scalesRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  scale: { alignItems: 'center' },
  scaleLabel: { color: '#9A9490', fontSize: 10, marginBottom: 2 },
  scaleEmoji: { fontSize: 18, marginBottom: 2 },
  scaleNum: { color: '#5A5550', fontSize: 12, fontWeight: '600' },
  reflection: { color: '#9A9490', fontSize: 13, fontStyle: 'italic', lineHeight: 19, marginTop: 4 },
});
