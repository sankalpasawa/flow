import React, { useCallback, useState } from 'react';
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
import { format, parseISO, addMinutes } from 'date-fns';
import { colors, getCategoryColor, radii, shadows, type } from '../../../theme';
import { Activity, ExperienceLog } from '../../../types';
import { HOUR_HEIGHT } from '../../../lib/calendar';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SWIPE_THRESHOLD = 80;
const SNAP_PX = HOUR_HEIGHT / 4; // 20px = 15 minutes

interface Props {
  activity: Activity;
  log?: ExperienceLog;
  onPress: () => void;
  onQuickComplete?: () => void;
  onReschedule?: (activityId: string, newStartTime: string) => void;
  isNow: boolean;
  isOverdue?: boolean;
  height?: number;
}

export function ActivityCard({ activity, log, onPress, onQuickComplete, onReschedule, isNow, isOverdue, height }: Props) {
  const cat = activity.category;
  const catColor = getCategoryColor(activity.category_id);
  const isDone = activity.status === 'COMPLETED';
  const isSkipped = activity.status === 'SKIPPED';

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDraggingVertical = useSharedValue(false);
  const disappearScale = useSharedValue(1);
  const hasPassedThreshold = useSharedValue(false);
  const lastSnapIndex = useSharedValue(0);

  // Drag time label state (JS thread)
  const [dragTimeLabel, setDragTimeLabel] = useState<string | null>(null);

  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerCompleteHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const triggerSnapHaptic = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const handleComplete = useCallback(() => {
    onQuickComplete?.();
  }, [onQuickComplete]);

  const updateDragTimeLabel = useCallback((snapCount: number) => {
    const startDate = parseISO(activity.start_time);
    const newDate = addMinutes(startDate, snapCount * 15);
    setDragTimeLabel(format(newDate, 'h:mm a'));
  }, [activity.start_time]);

  const clearDragTimeLabel = useCallback(() => {
    setDragTimeLabel(null);
  }, []);

  const handleReschedule = useCallback((snapCount: number) => {
    if (!onReschedule || snapCount === 0) return;
    const startDate = parseISO(activity.start_time);
    const newDate = addMinutes(startDate, snapCount * 15);
    onReschedule(activity.id, newDate.toISOString());
  }, [onReschedule, activity.id, activity.start_time]);

  // Horizontal pan — swipe to complete (existing)
  const horizontalPan = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-10, 10])
    .enabled(!!onQuickComplete && !isDone)
    .onUpdate((e) => {
      const tx = Math.max(0, e.translationX);
      translateX.value = tx;

      if (tx > SWIPE_THRESHOLD && !hasPassedThreshold.value) {
        hasPassedThreshold.value = true;
        runOnJS(triggerLightHaptic)();
      } else if (tx <= SWIPE_THRESHOLD && hasPassedThreshold.value) {
        hasPassedThreshold.value = false;
      }
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(300, { duration: 250 }, () => {
          disappearScale.value = withTiming(0, { duration: 200 });
        });
        runOnJS(triggerCompleteHaptic)();
        runOnJS(handleComplete)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
      hasPassedThreshold.value = false;
    });

  // Vertical pan — drag to reschedule
  const verticalPan = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-20, 20])
    .enabled(!!onReschedule)
    .onStart(() => {
      isDraggingVertical.value = true;
      lastSnapIndex.value = 0;
      runOnJS(updateDragTimeLabel)(0);
    })
    .onUpdate((e) => {
      // Snap to 15-minute increments
      const snapIndex = Math.round(e.translationY / SNAP_PX);
      const snappedY = snapIndex * SNAP_PX;
      translateY.value = snappedY;

      // Haptic on each new snap point
      if (snapIndex !== lastSnapIndex.value) {
        lastSnapIndex.value = snapIndex;
        runOnJS(triggerSnapHaptic)();
        runOnJS(updateDragTimeLabel)(snapIndex);
      }
    })
    .onEnd(() => {
      const finalSnap = Math.round(translateY.value / SNAP_PX);
      isDraggingVertical.value = false;
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      runOnJS(clearDragTimeLabel)();
      if (finalSnap !== 0) {
        runOnJS(handleReschedule)(finalSnap);
      }
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

  const composed = Gesture.Race(horizontalPan, verticalPan, longPressGesture, tapGesture);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value * disappearScale.value },
    ],
    opacity: interpolate(
      translateX.value,
      [0, 200],
      [1, 0.3],
      Extrapolation.CLAMP,
    ),
    // Deepen shadow while dragging vertically
    shadowOpacity: isDraggingVertical.value ? 0.15 : 0.04,
    shadowRadius: isDraggingVertical.value ? 12 : 2,
    elevation: isDraggingVertical.value ? 6 : 1,
    zIndex: isDraggingVertical.value ? 100 : 0,
  }));

  // Guide line at the snapped position (shown at original card position while card moves)
  const guideLineStyle = useAnimatedStyle(() => ({
    opacity: isDraggingVertical.value && translateY.value !== 0 ? 0.6 : 0,
    transform: [{ translateY: translateY.value }],
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
  const cardBorderRadius = compact ? 8 : 14;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={{ position: 'relative', marginBottom: 2 }}>
        {/* Green background revealed on swipe */}
        <Animated.View
          style={[
            styles.swipeBg,
            { borderRadius: cardBorderRadius },
            height !== undefined && { height },
            bgAnimStyle,
          ]}
        >
          <Text style={styles.checkmark}>{'\u2713'}</Text>
        </Animated.View>

        {/* Horizontal guide line at snap destination */}
        <Animated.View
          style={[styles.guideLine, guideLineStyle]}
          pointerEvents="none"
        />

        <AnimatedPressable
          style={[
            styles.card,
            {
              borderLeftColor: catColor.solid,
              backgroundColor: catColor.light,
              borderRadius: cardBorderRadius,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 2,
              elevation: 1,
            },
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

          {/* Drag time label */}
          {dragTimeLabel && (
            <View style={styles.dragTimeBadge}>
              <Text style={styles.dragTimeText}>{dragTimeLabel}</Text>
            </View>
          )}
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
    borderLeftWidth: 3,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    color: colors.text, fontSize: 14, fontWeight: '600', lineHeight: 18,
  },
  titleCompact: {
    fontSize: 12, lineHeight: 15,
  },
  titleDone: {
    textDecorationLine: 'line-through', color: colors.muted,
  },
  metaRow: {
    flexDirection: 'row', gap: 6, marginTop: 2,
  },
  meta: {
    color: colors.text2, fontSize: 11, fontWeight: '500',
  },
  indicators: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
  },
  dot: {
    width: 7, height: 7, borderRadius: 4,
  },
  guideLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    zIndex: 50,
  },
  dragTimeBadge: {
    position: 'absolute',
    top: -24,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dragTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
