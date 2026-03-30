import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
import { colors, getCategoryColor, type } from '../../../theme';
import { Activity } from '../../../types';

interface Props {
  task: Activity;
  onPress: () => void;
  onToggle: () => void;
  isOverdue?: boolean;
}

const SWIPE_THRESHOLD = 72;

function triggerLightHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function triggerSuccessHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function TaskItem({ task, onPress, onToggle, isOverdue }: Props) {
  const isDone = task.status === 'COMPLETED';
  const catColor = getCategoryColor(task.category_id);
  const subtasksDone = task.subtasks.filter(s => s.done).length;
  const subtasksTotal = task.subtasks.length;

  const translateX = useSharedValue(0);
  const hasPassedThreshold = useSharedValue(false);
  const completedScale = useSharedValue(1);

  const handleToggleWithHaptic = useCallback(() => {
    triggerSuccessHaptic();
    onToggle();
  }, [onToggle]);

  const handleCheckboxPress = useCallback(() => {
    triggerLightHaptic();
    onToggle();
  }, [onToggle]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX(isDone ? [-20, 20] : [20, 20])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      // Allow both directions: right = complete, left = undo when done
      const tx = isDone
        ? Math.min(0, e.translationX)  // left swipe to undo
        : Math.max(0, e.translationX); // right swipe to complete
      translateX.value = tx;

      const absTx = Math.abs(tx);
      if (absTx > SWIPE_THRESHOLD && !hasPassedThreshold.value) {
        hasPassedThreshold.value = true;
        runOnJS(triggerLightHaptic)();
      } else if (absTx <= SWIPE_THRESHOLD && hasPassedThreshold.value) {
        hasPassedThreshold.value = false;
      }
    })
    .onEnd(() => {
      const absTx = Math.abs(translateX.value);
      if (absTx > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 1 : -1;
        translateX.value = withTiming(direction * 300, { duration: 200 }, () => {
          completedScale.value = withTiming(0, { duration: 150 });
        });
        runOnJS(handleToggleWithHaptic)();
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 250 });
      }
      hasPassedThreshold.value = false;
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const composed = Gesture.Race(swipeGesture, tapGesture);

  const rowAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scaleY: completedScale.value },
    ],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, 200],
      [1, 0.4],
      Extrapolation.CLAMP,
    ),
  }));

  const swipeBgOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={styles.container}>
        {/* Swipe underlay — green for complete, amber for undo */}
        <Animated.View
          style={[
            styles.swipeBg,
            isDone ? styles.swipeBgUndo : styles.swipeBgComplete,
            swipeBgOpacity,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.swipeIcon}>{isDone ? '↩' : '✓'}</Text>
        </Animated.View>

        <Animated.View
          style={[styles.row, rowAnimStyle]}
        >
          <TouchableOpacity
            style={[styles.checkbox, isDone && styles.checkboxDone]}
            onPress={handleCheckboxPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
          >
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={1}>
            {task.title}
          </Text>

          {subtasksTotal > 0 && (
            <Text style={styles.subtaskCount}>{subtasksDone}/{subtasksTotal}</Text>
          )}

          {isOverdue && <View style={styles.overdueDot} />}

          <View style={[styles.categoryDot, { backgroundColor: catColor.solid }]} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  swipeBgComplete: {
    backgroundColor: colors.sage,
    alignItems: 'flex-start',
  },
  swipeBgUndo: {
    backgroundColor: colors.amber,
    alignItems: 'flex-end',
  },
  swipeIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.done, borderColor: colors.done },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  title: { flex: 1, color: colors.text, ...type.bodyRegular },
  titleDone: { textDecorationLine: 'line-through', color: colors.muted },
  subtaskCount: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  overdueDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
});
