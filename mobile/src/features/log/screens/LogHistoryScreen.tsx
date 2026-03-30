import React, { useEffect, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet, SafeAreaView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { format, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { getLogsForUser } from '../../../lib/db/logs';
import { ExperienceLog } from '../../../types';
import { NetworkBanner } from '../../../components/common/NetworkBanner';
import { colors, radii, shadows, spacing, type, getCategoryColor } from '../../../theme';

const MOOD_EMOJI = ['', '😫', '😕', '😐', '🙂', '🔥'];
const ENERGY_EMOJI = ['', '🪫', '🔋', '⚡', '💪', '🚀'];

type LogWithActivity = ExperienceLog & { activity_title?: string; category_id?: string };

interface Section {
  title: string;
  data: LogWithActivity[];
}

function groupLogsByDate(logs: LogWithActivity[]): Section[] {
  const today: LogWithActivity[] = [];
  const yesterday: LogWithActivity[] = [];
  const thisWeek: LogWithActivity[] = [];
  const older: LogWithActivity[] = [];

  for (const log of logs) {
    const d = parseISO(log.logged_at);
    if (isToday(d)) today.push(log);
    else if (isYesterday(d)) yesterday.push(log);
    else if (isThisWeek(d)) thisWeek.push(log);
    else older.push(log);
  }

  const sections: Section[] = [];
  if (today.length) sections.push({ title: 'Today', data: today });
  if (yesterday.length) sections.push({ title: 'Yesterday', data: yesterday });
  if (thisWeek.length) sections.push({ title: 'This Week', data: thisWeek });
  if (older.length) sections.push({ title: 'Earlier', data: older });
  return sections;
}

export function LogHistoryScreen() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<LogWithActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getLogsForUser(user.id)
      .then(setLogs)
      .catch((err) => { console.error('[DayFlow] Failed to load log history:', err); })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>Log History</Text></View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
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
          <Text style={styles.emptyBody}>
            Complete an activity and log your experience to start building your history.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const sections = groupLogsByDate(logs);

  return (
    <SafeAreaView style={styles.container}>
      <NetworkBanner />
      <View style={styles.header}><Text style={styles.headerTitle}>Log History</Text></View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => <LogCard log={item} />}
      />
    </SafeAreaView>
  );
}

function LogCard({ log }: { log: LogWithActivity }) {
  const catColor = log.category_id ? getCategoryColor(log.category_id) : { solid: colors.primary, light: colors.primaryBg };
  const timeStr = format(parseISO(log.logged_at), 'h:mm a');
  const dateStr = format(parseISO(log.logged_at), 'MMM d');
  const mood = log.mood ?? 0;
  const energy = log.energy ?? 0;

  return (
    <View style={[styles.card, shadows.card, { borderLeftColor: catColor.solid }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {log.activity_title ?? 'Activity'}
          </Text>
        </View>
        <Text style={styles.cardDate}>{dateStr} · {timeStr}</Text>
      </View>

      <View style={styles.scalesRow}>
        <MetricPill emoji={MOOD_EMOJI[mood]} label="Mood" value={mood} color={colors.amber} />
        <MetricPill emoji={ENERGY_EMOJI[energy]} label="Energy" value={energy} color={colors.primary} />
        <View style={styles.completionPill}>
          <Text style={styles.completionValue}>{log.completion_pct}%</Text>
          <Text style={styles.metricLabel}>Done</Text>
        </View>
      </View>

      {!!log.reflection && (
        <View style={styles.reflectionRow}>
          <Text style={styles.reflectionQuote}>"</Text>
          <Text style={styles.reflection} numberOfLines={3}>{log.reflection}</Text>
        </View>
      )}
    </View>
  );
}

function MetricPill({ emoji, label, value, color }: {
  emoji: string; label: string; value: number; color: string;
}) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricEmoji}>{emoji}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}/5</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: { color: colors.text, ...type.h2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },

  // Empty state
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  emptyBody: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // List
  listContent: { paddingHorizontal: spacing.screen, paddingBottom: 100 },

  // Section header
  sectionHeader: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionHeaderText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderLeftWidth: 4,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTitleRow: { flex: 1 },
  activityTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  cardDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 0,
  },

  // Metrics row
  scalesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricPill: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 52,
  },
  metricEmoji: { fontSize: 16, marginBottom: 2 },
  metricValue: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  metricLabel: { color: colors.muted, fontSize: 9, fontWeight: '600', letterSpacing: 0.3 },

  completionPill: {
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 52,
  },
  completionValue: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },

  // Reflection
  reflectionRow: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reflectionQuote: {
    color: colors.border,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: -2,
  },
  reflection: {
    flex: 1,
    color: colors.text2,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
});
