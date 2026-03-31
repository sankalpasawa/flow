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
import { colors, getCategoryColor, shadows, type } from '../../../theme';
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

/**
 * Blend a hex category color at a given opacity onto a white base.
 * Returns an rgba string approximating the glass + category tint.
 */
function glassTintBackground(catHex: string): string {
  // Parse hex
  const r = parseInt(catHex.slice(1, 3), 16);
  const g = parseInt(catHex.slice(3, 5), 16);
  const b = parseInt(catHex.slice(5, 7), 16);
  // White base at 0.65 opacity, then overlay category at 0.06 opacity
  // Approximate: blend category color at 6% onto the white glass
  const tint = colors.categoryTint; // 0.06
  const baseR = 255;
  const baseG = 255;
  const baseB = 255;
  const finalR = Math.round(baseR * (1 - tint) + r * tint);
  const finalG = Math.round(baseG * (1 - tint) + g * tint);
  const finalB = Math.round(baseB * (1 - tint) + b * tint);
  return `rgba(${finalR},${finalG},${finalB},0.65)`;
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
    if (!activity.start_time) return;
    const startDate = parseISO(activity.start_time);
    const newDate = addMinutes(startDate, snapCount * 15);
    setDragTimeLabel(format(newDate, 'h:mm a'));
  }, [activity.start_time]);

  const clearDragTimeLabel = useCallback(() => {
    setDragTimeLabel(null);
  }, []);

  const handleReschedule = useCallback((snapCount: number) => {
    if (!onReschedule || snapCount === 0 || !activity.start_time) return;
    const startDate = parseISO(activity.start_time);
    const newDate = addMinutes(startDate, snapCount * 15);
    onReschedule(activity.id, newDate.toISOString());
  }, [onReschedule, activity.id, activity.start_time]);

  // Horizontal pan — swipe to complete
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
      const snapIndex = Math.round(e.translationY / SNAP_PX);
      const snappedY = snapIndex * SNAP_PX;
      translateY.value = snappedY;

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
    shadowOpacity: isDraggingVertical.value ? 0.15 : 0.06,
    shadowRadius: isDraggingVertical.value ? 12 : 8,
    elevation: isDraggingVertical.value ? 6 : 3,
    zIndex: isDraggingVertical.value ? 100 : 0,
  }));

  // Guide line at the snapped position
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

  const compact = height !== undefined && height < 50;
  const cardBorderRadius = compact ? 12 : 14;
  const pillBg = glassTintBackground(catColor.solid);

  // Subtask progress
  const subtasks = activity.subtasks ?? [];
  const hasSubtasks = subtasks.length > 0;
  const subtasksDone = subtasks.filter((s) => s.done).length;
  const subtaskProgress = hasSubtasks ? subtasksDone / subtasks.length : 0;

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
              backgroundColor: pillBg,
              borderWidth: 1,
              borderColor: colors.glass.border,
              borderRadius: cardBorderRadius,
              // Multi-layer shadow (first layer)
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            },
            height !== undefined && { height, paddingVertical: compact ? 3 : 6 },
            isNow && styles.nowCard,
            isDone && styles.doneCard,
            isSkipped && { opacity: 0.4 },
            cardAnimStyle,
          ]}
        >
          {/* Row 1: Category icon + Title */}
          <View style={styles.row1}>
            {cat?.icon ? (
              <Text style={styles.catIcon}>{cat.icon}</Text>
            ) : null}
            <Text
              style={[
                styles.title,
                compact && styles.titleCompact,
                isDone && styles.titleDone,
              ]}
              numberOfLines={1}
            >
              {activity.title}
            </Text>
            {/* Status indicators */}
            <View style={styles.indicators}>
              {log && <View style={[styles.dot, { backgroundColor: moodColor(log.mood) }]} />}
              {isOverdue && <View style={[styles.dot, { backgroundColor: colors.danger }]} />}
            </View>
          </View>

          {/* Row 2: Mindset prompt (always show if exists) */}
          {activity.mindset_prompt ? (
            <Text
              style={[
                styles.mindset,
                compact && styles.mindsetCompact,
              ]}
              numberOfLines={compact ? 1 : 2}
            >
              {activity.mindset_prompt}
            </Text>
          ) : null}

          {/* Row 3: Subtask progress bar (optional) */}
          {hasSubtasks && !compact && (
            <View style={styles.subtaskRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${subtaskProgress * 100}%` }]} />
              </View>
              <Text style={styles.subtaskCount}>{subtasksDone}/{subtasks.length}</Text>
            </View>
          )}

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
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  nowCard: {
    // Amber glow for active activity — using shadow instead of border
    shadowColor: colors.active,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderColor: 'rgba(196,121,91,0.35)',
  },
  doneCard: {
    opacity: 0.4,
  },
  // Row 1: icon + title
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catIcon: {
    fontSize: 15,
    lineHeight: 18,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  titleCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  // Row 2: mindset
  mindset: {
    color: colors.text2,
    fontSize: 9.5,
    fontStyle: 'italic',
    opacity: 0.6,
    lineHeight: 13,
    marginTop: 2,
  },
  mindsetCompact: {
    fontSize: 8.5,
    lineHeight: 11,
  },
  // Row 3: subtask progress
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
  },
  subtaskCount: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.muted,
  },
  indicators: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
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
