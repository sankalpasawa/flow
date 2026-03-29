import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator, Animated, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { format, addDays } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { Activity } from '../../../types';
import { colors, radii, shadows, spacing, getCategoryColor } from '../../../theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

// ─── Category grouping helper ────────────────────

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  tasks: Activity[];
}

function groupByCategory(tasks: Activity[]): CategoryGroup[] {
  const map = new Map<string, Activity[]>();
  for (const t of tasks) {
    const key = t.category_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries()).map(([categoryId, items]) => ({
    categoryId,
    categoryName: items[0].category?.name ?? 'Other',
    categoryIcon: items[0].category?.icon ?? '📌',
    tasks: items,
  }));
}

// ─── Main screen ─────────────────────────────────

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

  const somedayGroups = groupByCategory(somedayTasks);
  // Flatten for isLast tracking: last task across all groups
  const allSomedayFlat = somedayGroups.flatMap(g => g.tasks);
  const lastSomedayId = allSomedayFlat.length > 0 ? allSomedayFlat[allSomedayFlat.length - 1].id : null;

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

          {/* Someday — grouped by category */}
          {somedayTasks.length > 0 && (
            <FadeInSection index={sectionIndex++}>
              <Section
                title="Someday"
                icon="💭"
                count={somedayTasks.length}
              >
                {somedayGroups.map((group, gi) => (
                  <React.Fragment key={group.categoryId}>
                    <CategorySubHeader
                      icon={group.categoryIcon}
                      name={group.categoryName}
                      count={group.tasks.length}
                      categoryId={group.categoryId}
                      isFirst={gi === 0}
                    />
                    {group.tasks.map((t) => (
                      <SomedayRow
                        key={t.id}
                        task={t}
                        isLast={t.id === lastSomedayId}
                        onAdd={() => moveToDate(t.id, tomorrowStr)}
                        onPress={() => navigation.navigate('ActivityDetail', { activityId: t.id })}
                      />
                    ))}
                  </React.Fragment>
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

// ─── Collapsible section wrapper ─────────────────

function Section({ title, icon, count, emptyText, children }: {
  title: string;
  icon: string;
  count: number;
  emptyText?: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const chevronRotation = useRef(new Animated.Value(0)).current;
  const hasChildren = React.Children.toArray(children).length > 0;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(prev => !prev);
    Animated.spring(chevronRotation, {
      toValue: collapsed ? 0 : 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const rotate = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-90deg'],
  });

  return (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHeader}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        accessibilityLabel={`${title}, ${count} items`}
        hitSlop={{ top: 4, bottom: 4 }}
      >
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
        <Animated.Text style={[styles.chevron, { transform: [{ rotate }] }]}>
          ›
        </Animated.Text>
      </Pressable>
      {!collapsed && (
        <View style={styles.sectionBody}>
          {hasChildren ? children : (
            <Text style={styles.emptyText}>{emptyText ?? 'None'}</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Category sub-header inside Someday ──────────

function CategorySubHeader({ icon, name, count, categoryId, isFirst }: {
  icon: string; name: string; count: number; categoryId: string; isFirst: boolean;
}) {
  const catColor = getCategoryColor(categoryId);

  return (
    <View style={[styles.catSubHeader, !isFirst && styles.catSubHeaderDivider]}>
      <View style={[styles.catIconCircle, { backgroundColor: catColor.light }]}>
        <Text style={styles.catSubIcon}>{icon}</Text>
      </View>
      <Text style={styles.catSubName}>{name}</Text>
      <Text style={styles.catSubCount}>{count}</Text>
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
  return (
    <Pressable
      style={[styles.row, styles.somedayRow, isLast && styles.rowLast]}
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
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8,
    minHeight: 40, // adequate tap target
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  countBadge: {
    backgroundColor: colors.primaryBg,
    borderRadius: 10,
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countText: {
    color: colors.primary, fontSize: 12, fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    color: colors.muted, fontSize: 20, fontWeight: '600',
    width: 20, textAlign: 'center',
  },
  sectionBody: {
    backgroundColor: colors.surface, borderRadius: radii.card,
    overflow: 'hidden', ...shadows.card,
  },
  emptyText: {
    color: colors.muted, fontSize: 13, padding: 20, textAlign: 'center',
    fontStyle: 'italic',
  },

  // Category sub-headers inside Someday section
  catSubHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.surface2,
  },
  catSubHeaderDivider: {
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  catIconCircle: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  catSubIcon: { fontSize: 12 },
  catSubName: { color: colors.text, fontSize: 12, fontWeight: '600', flex: 1 },
  catSubCount: {
    color: colors.muted, fontSize: 11, fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    borderLeftWidth: 3,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  carryRow: {
    flexWrap: 'wrap',
  },
  somedayRow: {
    borderLeftWidth: 0, // category is shown via sub-header, not left border
    paddingLeft: 17, // 14 + 3 to match alignment with bordered rows
  },
  rowContent: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '500' },
  rowTitleDone: { textDecorationLine: 'line-through', color: colors.muted },
  rowMeta: {
    color: colors.text2, fontSize: 11, marginTop: 2,
    fontVariant: ['tabular-nums'],
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

  // Action buttons
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

  // CTA
  ctaButton: {
    backgroundColor: colors.primary, borderRadius: radii.button,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
    ...shadows.card,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },

  bottomPadding: { height: 100 },
});
