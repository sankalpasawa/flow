import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, getCategoryColor, radii } from '../../../theme';
import { Activity, ExperienceLog } from '../../../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  activity: Activity;
  log?: ExperienceLog;
  onPress: () => void;
  onQuickComplete?: () => void;
  isNow: boolean;
  isOverdue?: boolean;
  height?: number;
}

export function ActivityCard({ activity, log, onPress, onQuickComplete, isNow, isOverdue, height }: Props) {
  const cat = activity.category;
  const catColor = getCategoryColor(activity.category_id);
  const isDone = activity.status === 'COMPLETED';
  const isSkipped = activity.status === 'SKIPPED';

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const duration = activity.duration_minutes;
  const durationText = duration === 0 ? '' : duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ''}`;

  const compact = height !== undefined && height < 40;

  return (
    <AnimatedPressable
      style={[
        styles.card,
        { borderLeftColor: catColor.solid, backgroundColor: catColor.light },
        height !== undefined && { height, paddingVertical: compact ? 2 : 6 },
        isNow && styles.nowCard,
        isSkipped && { opacity: 0.4 },
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
    >
      <View style={styles.topRow}>
        <View style={styles.content}>
          <Text style={[styles.title, compact && styles.titleCompact, isDone && styles.titleDone]} numberOfLines={1}>
            {activity.title}
          </Text>
          {!compact && (
            <View style={styles.metaRow}>
              {durationText ? <Text style={styles.meta}>{durationText}</Text> : null}
              {cat && <Text style={[styles.meta, { color: catColor.solid }]}>{cat.icon} {cat.name}</Text>}
            </View>
          )}
        </View>

        {/* Status indicators */}
        <View style={styles.indicators}>
          {log && <View style={[styles.dot, { backgroundColor: moodColor(log.mood) }]} />}
          {isOverdue && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
        </View>
      </View>

    </AnimatedPressable>
  );
}

function moodColor(mood: number): string {
  const map = ['', colors.danger, '#F59E0B', colors.muted, colors.sage, colors.primary];
  return map[mood] ?? colors.muted;
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 2,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  nowCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.terra,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  content: { flex: 1 },
  title: {
    color: colors.text, fontSize: 16, fontWeight: '600',
  },
  titleCompact: {
    fontSize: 13,
  },
  titleDone: {
    textDecorationLine: 'line-through', color: colors.muted,
  },
  metaRow: {
    flexDirection: 'row', gap: 8, marginTop: 2,
  },
  meta: {
    color: colors.text2, fontSize: 12,
  },
  indicators: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
  },
  dot: {
    width: 7, height: 7, borderRadius: 4,
  },
});
