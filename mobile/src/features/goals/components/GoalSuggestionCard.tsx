import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Goal, GoalMetricType } from '../../../types';
import { colors, radii, spacing } from '../../../theme';

interface GoalWithProgress extends Goal {
  current_value: number;
}

interface Props {
  goal: GoalWithProgress;
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

function buildSuggestionMessage(goal: GoalWithProgress): string {
  const remaining = Math.max(0, goal.target_value - goal.current_value);
  const categoryName = goal.category?.name ?? 'activity';
  const freq = goal.frequency === 'DAILY' ? 'today' : 'this week';

  if (goal.metric_type === 'TIME') {
    const mins = remaining;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const timeStr = m > 0 ? `${h}h ${m}m` : `${h}h`;
      return `You need ${timeStr} more ${categoryName.toLowerCase()} ${freq}`;
    }
    return `You need ${mins}m more ${categoryName.toLowerCase()} ${freq}`;
  }
  return `You need ${remaining} more ${categoryName.toLowerCase()} session${remaining !== 1 ? 's' : ''} ${freq}`;
}

function buildSuggestedLabel(goal: GoalWithProgress): string {
  if (goal.metric_type === 'TIME') {
    const remaining = Math.max(0, goal.target_value - goal.current_value);
    if (remaining >= 60) return `${Math.floor(remaining / 60)}h block`;
    return `${remaining}m block`;
  }
  return 'session';
}

function buildSuggestedDuration(goal: GoalWithProgress): number {
  if (goal.metric_type === 'TIME') {
    return Math.max(0, goal.target_value - goal.current_value);
  }
  return 30; // default 30 min for session-based goals
}

export function GoalSuggestionCard({ goal, navigation }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (goal.current_value >= goal.target_value) return null;

  const icon = goal.category?.icon ?? '\uD83C\uDFAF';
  const message = buildSuggestionMessage(goal);
  const suggestedLabel = buildSuggestedLabel(goal);
  const suggestedDuration = buildSuggestedDuration(goal);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.addBtn}
          onPress={() => navigation.navigate('ActivityForm', {
            category_id: goal.category_id,
            duration_minutes: suggestedDuration,
          })}
          accessibilityLabel={`Add ${suggestedLabel}`}
        >
          <Text style={styles.addBtnText}>+ Add {suggestedLabel}</Text>
        </Pressable>
        <Pressable
          style={styles.dismissBtn}
          onPress={() => setDismissed(true)}
          accessibilityLabel="Dismiss suggestion"
        >
          <Text style={styles.dismissBtnText}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryBg,
    borderRadius: radii.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  icon: { fontSize: 16 },
  message: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissBtn: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dismissBtnText: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: '600',
  },
});
