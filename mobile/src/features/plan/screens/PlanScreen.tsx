import React, { useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator, Animated,
} from 'react-native';
import { format, addDays } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { Activity } from '../../../types';
import { colors, radii, shadows, spacing, getCategoryColor } from '../../../theme';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

// ─── Pressable with scale feedback ───────────────

function ScalePressable({ onPress, style, children, disabled, ...rest }: {
  onPress: () => void; style?: any; children: React.ReactNode; disabled?: boolean;
  [key: string]: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Staggered section animation ─────────────────

function FadeInSection({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export function PlanScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const {
    planActivities, planTasks, carryForward, somedayTasks, planLoading,
    loadPlan, moveToDate, moveToSomeday, quickToggleComplete,
  } = useActivitiesStore();

  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

  const load = useCallback(() => {
    if (user) loadPlan(user.id);
  }, [user, loadPlan]);

  useEffect(() => { load(); }, [load]);

  const tomorrowBlockCount = planActivities.length;
  const tomorrowTaskCount = planTasks.filter(t => t.status !== 'COMPLETED').length;
  const totalPlanned = tomorrowBlockCount + tomorrowTaskCount;

  let sectionIndex = 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan Tomorrow</Text>
        <Text style={styles.headerSubtitle}>
          {format(tomorrow, 'EEEE, MMMM d')}
          {totalPlanned > 0 ? ` \u2014 ${totalPlanned} planned` : ''}
        </Text>
      </View>

      {planLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Tomorrow's Plan */}
          <FadeInSection index={sectionIndex++}>
            <Section
              title="Tomorrow's Plan"
              icon="📋"
              count={totalPlanned}
              emptyText="Nothing planned yet \u2014 add items below"
            >
              {planActivities.map((a, i) => (
                <PlanActivityRow
                  key={a.id}
                  activity={a}
                  isLast={i === planActivities.length - 1 && planTasks.length === 0}
                  onPress={() => navigation.navigate('ActivityDetail', { activityId: a.id })}
                  onToggle={() => quickToggleComplete(a.id)}
                />
              ))}
              {planTasks.map((t, i) => (
                <PlanTaskRow
                  key={t.id}
                  task={t}
                  isLast={i === planTasks.length - 1}
                  onPress={() => navigation.navigate('ActivityDetail', { activityId: t.id })}
                  onToggle={() => quickToggleComplete(t.id)}
                />
              ))}
            </Section>
          </FadeInSection>

          {/* Carry Forward */}
          {carryForward.length > 0 && (
            <FadeInSection index={sectionIndex++}>
              <Section
                title="Carry Forward"
                icon="⏩"
                count={carryForward.length}
              >
                {carryForward.map((a, i) => (
                  <CarryForwardRow
                    key={a.id}
                    activity={a}
                    isLast={i === carryForward.length - 1}
                    onMoveToTomorrow={() => moveToDate(a.id, tomorrowStr)}
                    onMoveToSomeday={() => moveToSomeday(a.id)}
                    onPress={() => navigation.navigate('ActivityDetail', { activityId: a.id })}
                  />
                ))}
              </Section>
            </FadeInSection>
          )}

          {/* Someday */}
          {somedayTasks.length > 0 && (
            <FadeInSection index={sectionIndex++}>
              <Section
                title="Someday"
                icon="💭"
                count={somedayTasks.length}
              >
                {somedayTasks.map((t, i) => (
                  <SomedayRow
                    key={t.id}
                    task={t}
                    isLast={i === somedayTasks.length - 1}
                    onAdd={() => moveToDate(t.id, tomorrowStr)}
                    onPress={() => navigation.navigate('ActivityDetail', { activityId: t.id })}
                  />
                ))}
              </Section>
            </FadeInSection>
          )}

          {/* Add to Tomorrow CTA */}
          <FadeInSection index={sectionIndex++}>
            <ScalePressable
              style={styles.ctaButton}
              onPress={() => navigation.navigate('ActivityForm', { date: tomorrowStr })}
              accessibilityLabel="Add activity for tomorrow"
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>+ Add to Tomorrow</Text>
            </ScalePressable>
          </FadeInSection>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Section wrapper ─────────────────────────────

function Section({ title, icon, count, emptyText, children }: {
  title: string;
  icon: string;
  count: number;
  emptyText?: string;
  children: React.ReactNode;
}) {
  const hasChildren = React.Children.toArray(children).length > 0;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>
        {hasChildren ? children : (
          <Text style={styles.emptyText}>{emptyText ?? 'None'}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Row components ──────────────────────────────

function PlanActivityRow({ activity, onPress, onToggle, isLast }: {
  activity: Activity; onPress: () => void; onToggle: () => void; isLast: boolean;
}) {
  const catColor = getCategoryColor(activity.category_id);
  const isDone = activity.status === 'COMPLETED';
  const startDate = new Date(activity.start_time);
  const timeStr = format(startDate, 'h:mm a');

  return (
    <Pressable
      style={[styles.row, { borderLeftColor: catColor.solid }, isLast && styles.rowLast]}
      onPress={onPress}
      accessibilityLabel={`${activity.title}, ${isDone ? 'completed' : 'planned'}`}
    >
      <Pressable
        style={[styles.checkbox, isDone && styles.checkboxDone]}
        onPress={onToggle}
        hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
      >
        {isDone && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, isDone && styles.rowTitleDone]} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={styles.rowMeta}>
          {timeStr} · {formatDuration(activity.duration_minutes)}
          {activity.category?.name ? ` · ${activity.category.icon} ${activity.category.name}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function PlanTaskRow({ task, onPress, onToggle, isLast }: {
  task: Activity; onPress: () => void; onToggle: () => void; isLast: boolean;
}) {
  const catColor = getCategoryColor(task.category_id);
  const isDone = task.status === 'COMPLETED';

  return (
    <Pressable
      style={[styles.row, { borderLeftColor: catColor.solid }, isLast && styles.rowLast]}
      onPress={onPress}
      accessibilityLabel={`${task.title}, ${isDone ? 'completed' : 'planned'}`}
    >
      <Pressable
        style={[styles.checkbox, isDone && styles.checkboxDone]}
        onPress={onToggle}
        hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
      >
        {isDone && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>
      <Text style={[styles.rowTitle, isDone && styles.rowTitleDone, { flex: 1 }]} numberOfLines={1}>
        {task.title}
      </Text>
      <View style={[styles.categoryDot, { backgroundColor: catColor.solid }]} />
    </Pressable>
  );
}

function CarryForwardRow({ activity, onMoveToTomorrow, onMoveToSomeday, onPress, isLast }: {
  activity: Activity; onMoveToTomorrow: () => void; onMoveToSomeday: () => void;
  onPress: () => void; isLast: boolean;
}) {
  const catColor = getCategoryColor(activity.category_id);
  const isTask = activity.activity_type === 'TASK';
  const daysOverdue = Math.floor((Date.now() - new Date(activity.assigned_date || activity.start_time).getTime()) / 86400000);

  return (
    <Pressable
      style={[styles.row, styles.carryRow, { borderLeftColor: catColor.solid }, isLast && styles.rowLast]}
      onPress={onPress}
      accessibilityLabel={`${activity.title}, ${daysOverdue} days overdue`}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>{activity.title}</Text>
        <Text style={styles.rowMeta}>
          {isTask ? 'Task' : formatDuration(activity.duration_minutes)}
          {daysOverdue > 0 ? ` · ${daysOverdue}d overdue` : ''}
          {activity.category?.name ? ` · ${activity.category.icon}` : ''}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <ScalePressable
          style={styles.moveButton}
          onPress={onMoveToTomorrow}
          accessibilityLabel={`Move ${activity.title} to tomorrow`}
        >
          <Text style={styles.moveButtonText}>Tomorrow</Text>
        </ScalePressable>
        <ScalePressable
          style={styles.somedayButton}
          onPress={onMoveToSomeday}
          accessibilityLabel={`Move ${activity.title} to someday`}
        >
          <Text style={styles.somedayButtonText}>Someday</Text>
        </ScalePressable>
      </View>
    </Pressable>
  );
}

function SomedayRow({ task, onAdd, onPress, isLast }: {
  task: Activity; onAdd: () => void; onPress: () => void; isLast: boolean;
}) {
  const catColor = getCategoryColor(task.category_id);

  return (
    <Pressable
      style={[styles.row, { borderLeftColor: catColor.solid }, isLast && styles.rowLast]}
      onPress={onPress}
      accessibilityLabel={task.title}
    >
      <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1}>{task.title}</Text>
      <ScalePressable
        style={styles.moveButton}
        onPress={onAdd}
        accessibilityLabel={`Add ${task.title} to tomorrow`}
      >
        <Text style={styles.moveButtonText}>+ Tomorrow</Text>
      </ScalePressable>
    </Pressable>
  );
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ─── Styles ──────────────────────────────────────

const SECTION_INNER_RADIUS = 12; // inner content radius
const SECTION_PADDING = 0; // rows go edge-to-edge
const SECTION_OUTER_RADIUS = SECTION_INNER_RADIUS + SECTION_PADDING; // concentric: 12 + 0 = 12
// Note: sectionBody uses radii.card (16) since rows have no visible radius —
// overflow:hidden clips them. The concentric rule applies when inner surfaces
// have visible rounding. Here the inner surfaces are flat, so outer radius
// is independent.

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 12,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '600' },
  headerSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: spacing.screen, paddingTop: 8 },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  countBadge: {
    backgroundColor: colors.primaryBg,
    borderRadius: 10,
    minWidth: 24, // prevent layout shift on single vs double digit
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countText: {
    color: colors.primary, fontSize: 12, fontWeight: '700',
    fontVariant: ['tabular-nums'], // prevent layout shift on count changes
  },
  sectionBody: {
    backgroundColor: colors.surface, borderRadius: radii.card,
    overflow: 'hidden', ...shadows.card,
  },
  emptyText: {
    color: colors.muted, fontSize: 13, padding: 20, textAlign: 'center',
    fontStyle: 'italic',
  },

  // Rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    borderLeftWidth: 3,
  },
  rowLast: {
    borderBottomWidth: 0, // prevent border clipping against rounded container corners
  },
  carryRow: {
    flexWrap: 'wrap',
  },
  rowContent: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '500' },
  rowTitleDone: { textDecorationLine: 'line-through', color: colors.muted },
  rowMeta: {
    color: colors.text2, fontSize: 11, marginTop: 2,
    fontVariant: ['tabular-nums'], // stable layout for "3d overdue" etc.
  },

  // Checkbox — 22px visible, hitSlop 11px each side = 44px hit area (WCAG)
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.done, borderColor: colors.done },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },

  // Action buttons — minHeight 32 + hitSlop gives adequate tap target
  actionButtons: { flexDirection: 'row', gap: 6 },
  moveButton: {
    backgroundColor: colors.primaryBg, borderRadius: radii.sm,
    paddingHorizontal: 12, paddingVertical: 7,
    minHeight: 32,
    justifyContent: 'center',
  },
  moveButtonText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  somedayButton: {
    backgroundColor: colors.surface2, borderRadius: radii.sm,
    paddingHorizontal: 12, paddingVertical: 7,
    minHeight: 32,
    justifyContent: 'center',
  },
  somedayButtonText: { color: colors.text2, fontSize: 11, fontWeight: '600' },

  // CTA — large, tactile button
  ctaButton: {
    backgroundColor: colors.primary, borderRadius: radii.button,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
    ...shadows.card,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },

  bottomPadding: { height: 100 },
});
