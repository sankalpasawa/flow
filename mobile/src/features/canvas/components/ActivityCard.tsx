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
  const cat = activity.category;
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
        isNow && styles.nowCard,
        isSkipped && { opacity: 0.4 },
        animStyle,
      ]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
    >
      <View style={styles.topRow}>
        {/* Circle + Title */}
        <Pressable
          style={[
            styles.circle,
            isDone && { backgroundColor: catColor.solid },
            !isDone && { borderWidth: 1.5, borderColor: catColor.solid + '50' },
          ]}
          onPress={(e) => { e.stopPropagation?.(); onQuickComplete?.(); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDone && <Text style={styles.check}>✓</Text>}
        </Pressable>

        <View style={styles.content}>
          <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={1}>
            {activity.title}
          </Text>
          <View style={styles.metaRow}>
            {durationText ? <Text style={styles.meta}>{durationText}</Text> : null}
            {cat && <Text style={[styles.meta, { color: catColor.solid }]}>{cat.icon} {cat.name}</Text>}
          </View>
        </View>

        {/* Status indicators */}
        <View style={styles.indicators}>
          {log && <View style={[styles.dot, { backgroundColor: moodColor(log.mood) }]} />}
          {isOverdue && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
        </View>
      </View>

      {/* Mindset prompt — subtle italic */}
      {activity.mindset_prompt && !isDone && (
        <Text style={styles.mindset} numberOfLines={1}>
          {activity.mindset_prompt}
        </Text>
      )}
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
  topRow: {
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
  metaRow: {
    flexDirection: 'row', gap: 8, marginTop: 2,
  },
  meta: {
    color: colors.text2, fontSize: 11,
  },
  indicators: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
  },
  dot: {
    width: 7, height: 7, borderRadius: 4,
  },
  mindset: {
    color: colors.primaryLight, fontSize: 11, fontStyle: 'italic',
    marginTop: 6, marginLeft: 32, opacity: 0.7,
  },
});
