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
}

export function ActivityCard({ activity, log, onPress, onQuickComplete, isNow, isOverdue }: Props) {
  const catColor = getCategoryColor(activity.category_id);
  const isDone = activity.status === 'COMPLETED';
  const isSkipped = activity.status === 'SKIPPED';

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const duration = activity.duration_minutes;
  const durationText = duration === 0 ? '' : duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ''}`;

  return (
    <AnimatedPressable
      style={[
        styles.card,
        { borderLeftColor: catColor.solid, backgroundColor: catColor.light },
        isSkipped && { opacity: 0.4 },
        isNow && styles.nowCard,
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
    >
      <View style={styles.row}>
        {/* Completion circle */}
        <Pressable
          style={[
            styles.circle,
            isDone && { backgroundColor: catColor.solid },
            !isDone && { borderWidth: 1.5, borderColor: catColor.solid + '40' },
          ]}
          onPress={(e) => { e.stopPropagation?.(); onQuickComplete?.(); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDone && <Text style={styles.check}>✓</Text>}
        </Pressable>

        {/* Title + duration */}
        <View style={styles.content}>
          <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={1}>
            {activity.title}
          </Text>
          {durationText ? <Text style={styles.duration}>{durationText}</Text> : null}
        </View>

        {/* Mood dot if logged */}
        {log && <View style={[styles.moodDot, { backgroundColor: moodColor(log.mood) }]} />}

        {/* Overdue indicator */}
        {isOverdue && <View style={styles.overdueDot} />}
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
    borderLeftWidth: 3,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    marginHorizontal: 12,
  },
  nowCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.terra,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circle: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  check: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { flex: 1 },
  title: {
    color: colors.text, fontSize: 14, fontWeight: '500',
  },
  titleDone: {
    textDecorationLine: 'line-through', color: colors.muted,
  },
  duration: {
    color: colors.text2, fontSize: 11, marginTop: 1,
  },
  moodDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  overdueDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.danger,
  },
});
