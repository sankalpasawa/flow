import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, getCategoryColor, radii } from '../../../theme';
import { Activity, ExperienceLog } from '../../../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SWIPE_THRESHOLD = 80;

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
  const translateX = useSharedValue(0);
  const disappearScale = useSharedValue(1);
  const hasPassedThreshold = useSharedValue(false);

  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerCompleteHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleComplete = useCallback(() => {
    onQuickComplete?.();
  }, [onQuickComplete]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-10, 10])
    .enabled(!!onQuickComplete && !isDone)
    .onUpdate((e) => {
      // Only allow right swipe
      const tx = Math.max(0, e.translationX);
      translateX.value = tx;

      // Threshold crossing haptic
      if (tx > SWIPE_THRESHOLD && !hasPassedThreshold.value) {
        hasPassedThreshold.value = true;
        runOnJS(triggerLightHaptic)();
      } else if (tx <= SWIPE_THRESHOLD && hasPassedThreshold.value) {
        hasPassedThreshold.value = false;
      }
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        // Complete: slide off to the right, then scale down to disappear
        translateX.value = withTiming(300, { duration: 250 }, () => {
          disappearScale.value = withTiming(0, { duration: 200 });
        });
        runOnJS(triggerCompleteHaptic)();
        runOnJS(handleComplete)();
      } else {
        // Spring back
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
      hasPassedThreshold.value = false;
    });

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    })
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(triggerCompleteHaptic)();
      runOnJS(onPress)();
    });

  const composed = Gesture.Race(panGesture, longPressGesture, tapGesture);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value * disappearScale.value },
    ],
    opacity: interpolate(
      translateX.value,
      [0, 200],
      [1, 0.3],
      Extrapolation.CLAMP,
    ),
  }));

  const bgAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const duration = activity.duration_minutes;
  const durationText = duration === 0 ? '' : duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ''}`;

  const compact = height !== undefined && height < 40;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={{ position: 'relative' }}>
        {/* Green background revealed on swipe */}
        <Animated.View
          style={[
            styles.swipeBg,
            height !== undefined && { height },
            bgAnimStyle,
          ]}
        >
          <Text style={styles.checkmark}>{'\u2713'}</Text>
        </Animated.View>

        <AnimatedPressable
          style={[
            styles.card,
            { borderLeftColor: catColor.solid, backgroundColor: catColor.light },
            height !== undefined && { height, paddingVertical: compact ? 2 : 6 },
            isNow && styles.nowCard,
            isSkipped && { opacity: 0.4 },
            cardAnimStyle,
          ]}
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
      </Animated.View>
    </GestureDetector>
  );
}

function moodColor(mood: number): string {
  const map = ['', colors.danger, '#F59E0B', colors.muted, colors.sage, colors.primary];
  return map[mood] ?? colors.muted;
}

const styles = StyleSheet.create({
  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.sage,
    borderRadius: 14,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
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
