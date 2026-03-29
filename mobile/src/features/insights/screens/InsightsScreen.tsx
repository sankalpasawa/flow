import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator, Animated, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { getAllActivities } from '../../../lib/db/activities';
import { getLogsForUser } from '../../../lib/db/logs';
import { Activity, ExperienceLog, Goal } from '../../../types';
import { colors, radii, shadows, spacing, getCategoryColor } from '../../../theme';
import { useGoalsStore } from '../../../store/goalsStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

const MOOD_EMOJI = ['', '😫', '😕', '😐', '🙂', '🔥'];
const ENERGY_EMOJI = ['', '🪫', '🔋', '⚡', '💪', '🚀'];

// ─── Analytics helpers ───────────────────────────

interface CompletionStats {
  total: number;
  completed: number;
  skipped: number;
  inProgress: number;
  planned: number;
  rate: number; // 0-1
}

interface DayMoodEnergy {
  date: string;
  dayLabel: string;
  avgMood: number;
  avgEnergy: number;
  logCount: number;
}

function computeCompletionStats(activities: Activity[], days: number): CompletionStats {
  const cutoff = subDays(new Date(), days);
  const recent = activities.filter(a => {
    const d = parseISO(a.start_time);
    return d >= cutoff;
  });
  const total = recent.length;
  const completed = recent.filter(a => a.status === 'COMPLETED').length;
  const skipped = recent.filter(a => a.status === 'SKIPPED').length;
  const inProgress = recent.filter(a => a.status === 'IN_PROGRESS').length;
  const planned = recent.filter(a => a.status === 'PLANNED').length;
  return { total, completed, skipped, inProgress, planned, rate: total > 0 ? completed / total : 0 };
}

function computeMoodEnergyTrend(logs: ExperienceLog[], days: number): DayMoodEnergy[] {
  const result: DayMoodEnergy[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.logged_at && l.logged_at.startsWith(dateStr));
    const avgMood = dayLogs.length > 0 ? dayLogs.reduce((s, l) => s + l.mood, 0) / dayLogs.length : 0;
    const avgEnergy = dayLogs.length > 0 ? dayLogs.reduce((s, l) => s + l.energy, 0) / dayLogs.length : 0;
    result.push({
      date: dateStr,
      dayLabel: format(day, 'EEE'),
      avgMood,
      avgEnergy,
      logCount: dayLogs.length,
    });
  }
  return result;
}

function findInsight(activities: Activity[], logs: ExperienceLog[]): string | null {
  if (logs.length < 3) return null;

  // Find day-of-week energy patterns
  const dayEnergy: Record<string, number[]> = {};
  for (const l of logs) {
    if (!l.logged_at) continue;
    const day = format(parseISO(l.logged_at), 'EEEE');
    if (!dayEnergy[day]) dayEnergy[day] = [];
    dayEnergy[day].push(l.energy);
  }

  let bestDay = '';
  let bestAvg = 0;
  let worstDay = '';
  let worstAvg = 6;
  for (const [day, energies] of Object.entries(dayEnergy)) {
    if (energies.length < 2) continue;
    const avg = energies.reduce((s, v) => s + v, 0) / energies.length;
    if (avg > bestAvg) { bestAvg = avg; bestDay = day; }
    if (avg < worstAvg) { worstAvg = avg; worstDay = day; }
  }

  if (bestDay && bestAvg > 3) return `Your energy peaks on ${bestDay}s ${ENERGY_EMOJI[Math.round(bestAvg)]}`;
  if (worstDay && worstAvg < 3) return `Energy dips on ${worstDay}s — plan lighter blocks`;

  // Completion rate insight
  const completionRate = activities.length > 0
    ? activities.filter(a => a.status === 'COMPLETED').length / activities.length
    : 0;
  if (completionRate > 0.8) return 'You complete 80%+ of your planned activities — strong consistency';
  if (completionRate < 0.4 && activities.length > 5) return 'Completion under 40% — try planning fewer, higher-priority blocks';

  return null;
}

// ─── Main screen ─────────────────────────────────

export function InsightsScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<ExperienceLog[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [acts, userLogs] = await Promise.all([
        getAllActivities(user.id),
        getLogsForUser(user.id, 200),
      ]);
      setActivities(acts);
      setLogs(userLogs);
    } catch (err) {
      console.error('[DayFlow] Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const stats7 = computeCompletionStats(activities, 7);
  const stats30 = computeCompletionStats(activities, 30);
  const trend = computeMoodEnergyTrend(logs, 7);
  const insight = findInsight(activities, logs);

  const { goals, loadGoals, getGoalProgress } = useGoalsStore();

  useEffect(() => { if (user) loadGoals(user.id); }, [user]);

  const [goalsWithProgress, setGoalsWithProgress] = useState<Array<Goal & { current_value: number }>>([]);

  useEffect(() => {
    if (!user || goals.length === 0) { setGoalsWithProgress([]); return; }
    Promise.all(goals.map(async (g) => {
      const progress = await getGoalProgress(g.id, user.id);
      return { ...g, current_value: progress?.current_value ?? 0 };
    })).then(setGoalsWithProgress);
  }, [goals, user]);

  const activeGoals = goalsWithProgress.filter(g => g.is_active);

  let sectionIdx = 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <Pressable
          style={styles.catBtn}
          onPress={() => navigation.navigate('CategoryList' as any)}
          accessibilityLabel="View categories"
        >
          <Text style={styles.catBtnText}>Categories</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyBody}>Start planning activities on the Today tab to see insights here.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* AI Insight Banner */}
          {insight && (
            <FadeIn index={sectionIdx++}>
              <View style={styles.insightBanner}>
                <Text style={styles.insightText}>💡 {insight}</Text>
              </View>
            </FadeIn>
          )}

          {/* Goals This Week */}
          {activeGoals.length > 0 && (
            <FadeIn index={sectionIdx++}>
              <Text style={styles.sectionLabel}>Goals This Week</Text>
              <View style={styles.goalsWeekCard}>
                {activeGoals.map((goal, i) => {
                  const pct = goal.target_value > 0 ? Math.min(1, goal.current_value / goal.target_value) : 0;
                  const isDone = goal.current_value >= goal.target_value;
                  const catColor = getCategoryColor(goal.category_id);
                  const icon = goal.category?.icon ?? '\uD83C\uDFAF';
                  const remaining = Math.max(0, goal.target_value - goal.current_value);
                  let statusText: string;
                  if (isDone) {
                    statusText = '\u2713 Complete';
                  } else if (goal.metric_type === 'TIME') {
                    statusText = remaining >= 60
                      ? `${Math.floor(remaining / 60)}h ${remaining % 60 > 0 ? `${remaining % 60}m` : ''} left`
                      : `${remaining}m left`;
                  } else {
                    statusText = `${remaining} session${remaining !== 1 ? 's' : ''} left`;
                  }
                  return (
                    <View
                      key={goal.id}
                      style={[
                        styles.goalWeekRow,
                        i < activeGoals.length - 1 && styles.goalWeekRowBorder,
                      ]}
                    >
                      <View style={styles.goalWeekHeader}>
                        <View style={[styles.goalWeekIcon, { backgroundColor: catColor.light }]}>
                          <Text style={styles.goalWeekIconText}>{icon}</Text>
                        </View>
                        <Text style={styles.goalWeekTitle} numberOfLines={1}>{goal.title}</Text>
                        <Text style={[styles.goalWeekStatus, isDone && styles.goalWeekStatusDone]}>
                          {statusText}
                        </Text>
                      </View>
                      <View style={styles.goalWeekBarTrack}>
                        <View
                          style={[
                            styles.goalWeekBarFill,
                            { width: `${Math.round(pct * 100)}%`, backgroundColor: catColor.solid },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </FadeIn>
          )}

          {/* Completion Stats */}
          <FadeIn index={sectionIdx++}>
            <Text style={styles.sectionLabel}>Completion</Text>
            <View style={styles.statsRow}>
              <StatCard label="7-day rate" value={`${Math.round(stats7.rate * 100)}%`} sub={`${stats7.completed}/${stats7.total}`} />
              <StatCard label="30-day rate" value={`${Math.round(stats30.rate * 100)}%`} sub={`${stats30.completed}/${stats30.total}`} />
            </View>
            <CompletionBar stats={stats7} />
          </FadeIn>

          {/* Mood & Energy Trend */}
          {logs.length > 0 && (
            <FadeIn index={sectionIdx++}>
              <Text style={styles.sectionLabel}>Mood & Energy (7 days)</Text>
              <View style={styles.trendCard}>
                <View style={styles.trendLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.amber }]} />
                    <Text style={styles.legendText}>Mood</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.legendText}>Energy</Text>
                  </View>
                </View>
                <View style={styles.trendChart}>
                  {trend.map((day) => (
                    <View key={day.date} style={styles.trendCol}>
                      <View style={styles.trendBars}>
                        <View style={[styles.trendBar, styles.trendBarMood, { height: day.avgMood > 0 ? `${(day.avgMood / 5) * 100}%` : 2 }]} />
                        <View style={[styles.trendBar, styles.trendBarEnergy, { height: day.avgEnergy > 0 ? `${(day.avgEnergy / 5) * 100}%` : 2 }]} />
                      </View>
                      <Text style={[styles.trendDayLabel, isSameDay(parseISO(day.date), new Date()) && styles.trendDayLabelToday]}>
                        {day.dayLabel}
                      </Text>
                      {day.logCount > 0 && (
                        <Text style={styles.trendEmoji}>{MOOD_EMOJI[Math.round(day.avgMood)]}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </FadeIn>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────

function FadeIn({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function CompletionBar({ stats }: { stats: CompletionStats }) {
  const total = stats.total || 1;
  return (
    <View style={styles.completionBarCard}>
      <View style={styles.completionBar}>
        {stats.completed > 0 && (
          <View style={[styles.completionSegment, { flex: stats.completed, backgroundColor: colors.done }]} />
        )}
        {stats.inProgress > 0 && (
          <View style={[styles.completionSegment, { flex: stats.inProgress, backgroundColor: colors.active }]} />
        )}
        {stats.skipped > 0 && (
          <View style={[styles.completionSegment, { flex: stats.skipped, backgroundColor: colors.muted }]} />
        )}
        {stats.planned > 0 && (
          <View style={[styles.completionSegment, { flex: stats.planned, backgroundColor: colors.border }]} />
        )}
      </View>
      <View style={styles.completionLegend}>
        <LegendDot color={colors.done} label={`Done ${stats.completed}`} />
        <LegendDot color={colors.active} label={`Active ${stats.inProgress}`} />
        <LegendDot color={colors.muted} label={`Skipped ${stats.skipped}`} />
        <LegendDot color={colors.border} label={`Planned ${stats.planned}`} />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 12,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '600' },
  catBtn: {
    backgroundColor: colors.surface, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  catBtnText: { color: colors.text2, fontSize: 13, fontWeight: '500' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: spacing.screen, paddingTop: 4 },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptyBody: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Insight banner
  insightBanner: {
    backgroundColor: colors.primaryBg, borderRadius: radii.card, padding: 16,
    marginBottom: 20, ...shadows.card,
  },
  insightText: { color: colors.primary, fontSize: 14, fontWeight: '500', lineHeight: 20 },

  // Section labels
  sectionLabel: {
    color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 4,
  },

  // Stat cards
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.card,
    padding: 16, alignItems: 'center', ...shadows.card,
  },
  statValue: {
    color: colors.primary, fontSize: 28, fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: { color: colors.text2, fontSize: 12, fontWeight: '500', marginTop: 2 },
  statSub: {
    color: colors.muted, fontSize: 11, marginTop: 2,
    fontVariant: ['tabular-nums'],
  },

  // Completion bar
  completionBarCard: {
    backgroundColor: colors.surface, borderRadius: radii.card, padding: 16,
    marginBottom: 24, ...shadows.card,
  },
  completionBar: {
    flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden',
    backgroundColor: colors.border,
  },
  completionSegment: { height: '100%' },
  completionLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },

  // Legend
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.muted, fontSize: 11, fontVariant: ['tabular-nums'] },

  // Trend chart
  trendCard: {
    backgroundColor: colors.surface, borderRadius: radii.card, padding: 16,
    marginBottom: 24, ...shadows.card,
  },
  trendLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  trendChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  trendCol: { flex: 1, alignItems: 'center', gap: 4 },
  trendBars: {
    flexDirection: 'row', gap: 3, height: 60, alignItems: 'flex-end',
  },
  trendBar: { width: 8, borderRadius: 4, minHeight: 2 },
  trendBarMood: { backgroundColor: colors.amber },
  trendBarEnergy: { backgroundColor: colors.primary },
  trendDayLabel: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  trendDayLabelToday: { color: colors.primary, fontWeight: '700' },
  trendEmoji: { fontSize: 10 },

  // Goals This Week
  goalsWeekCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
    marginBottom: 24,
    ...shadows.card,
  },
  goalWeekRow: {
    paddingVertical: 10,
  },
  goalWeekRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  goalWeekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  goalWeekIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalWeekIconText: { fontSize: 12 },
  goalWeekTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  goalWeekStatus: {
    color: colors.text2,
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  goalWeekStatusDone: { color: colors.done },
  goalWeekBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalWeekBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
