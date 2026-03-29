import React, { useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { Goal, GoalMetricType } from '../../../types';
import { colors, radii, shadows, spacing, getCategoryColor } from '../../../theme';
import { useGoalsStore } from '../../../store/goalsStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GoalWithProgress extends Goal {
  current_value: number;
}

interface Props {
  goals: GoalWithProgress[];
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

function formatProgress(goal: GoalWithProgress): string {
  const remaining = Math.max(0, goal.target_value - goal.current_value);
  if (remaining === 0) return '\u2713 today';
  if (goal.metric_type === 'TIME') {
    const mins = remaining;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m to go` : `${h}h to go`;
    }
    return `${mins}m to go`;
  }
  return `${remaining} more to go`;
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${Math.round(pct * 100)}%` }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});

function GoalRow({ goal, isLast }: { goal: GoalWithProgress; isLast: boolean }) {
  const catColor = getCategoryColor(goal.category_id);
  const icon = goal.category?.icon ?? '\uD83C\uDFAF';
  const statusText = formatProgress(goal);
  const isDone = goal.current_value >= goal.target_value;

  return (
    <View style={[rowStyles.row, isLast && rowStyles.rowLast]}>
      <View style={[rowStyles.iconCircle, { backgroundColor: catColor.light }]}>
        <Text style={rowStyles.icon}>{icon}</Text>
      </View>
      <View style={rowStyles.content}>
        <View style={rowStyles.titleRow}>
          <Text style={rowStyles.title} numberOfLines={1}>{goal.title}</Text>
          <Text style={[rowStyles.status, isDone && rowStyles.statusDone]}>{statusText}</Text>
        </View>
        {goal.metric_type === 'TIME' ? (
          <ProgressBar current={goal.current_value} target={goal.target_value} />
        ) : (
          <Text style={rowStyles.fraction}>
            {goal.current_value}/{goal.target_value} sessions
          </Text>
        )}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 14 },
  content: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.text, fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  status: { color: colors.text2, fontSize: 11, fontWeight: '500' },
  statusDone: { color: colors.done },
  fraction: {
    color: colors.text2,
    fontSize: 11,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
});

export function GoalSection({ goals, navigation }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const chevronRotation = useRef(new Animated.Value(0)).current;

  const activeGoals = goals.filter(g => g.is_active);

  if (activeGoals.length === 0) return null;

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
        accessibilityLabel={`Goals, ${activeGoals.length} items`}
        hitSlop={{ top: 4, bottom: 4 }}
      >
        <Text style={styles.sectionIcon}>{'\uD83C\uDFAF'}</Text>
        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{activeGoals.length}</Text>
        </View>
        <Animated.Text style={[styles.chevron, { transform: [{ rotate }] }]}>
          {'\u203A'}
        </Animated.Text>
      </Pressable>
      {!collapsed && (
        <View style={styles.sectionBody}>
          {activeGoals.map((g, i) => (
            <GoalRow key={g.id} goal={g} isLast={i === activeGoals.length - 1} />
          ))}
          <Pressable
            style={styles.addLink}
            onPress={() => navigation.navigate('GoalForm')}
            accessibilityLabel="Add a goal"
          >
            <Text style={styles.addLinkText}>+ Add a goal</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    minHeight: 40,
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
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: '600',
    width: 20,
    textAlign: 'center',
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  addLink: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  addLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
