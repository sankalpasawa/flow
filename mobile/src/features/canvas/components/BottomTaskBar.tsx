import React, { useState, useRef, useCallback, useEffect } from 'react';
import { captureOnContentChange } from '../../../debug/DesignQA';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  Pressable,
  PanResponder,
} from 'react-native';
import { Activity } from '../../../types';
import { colors, getCategoryColor, shadows } from '../../../theme';

interface BottomTaskBarProps {
  tasks: Activity[];
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
  onQuickAdd: (title: string) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 44;
const EXPANDED_MAX_HEIGHT = SCREEN_HEIGHT * 0.55;
const DRAG_HANDLE_HEIGHT = 28;

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  useNativeDriver: true,
};

export function BottomTaskBar({ tasks, onToggle, onPress, onQuickAdd }: BottomTaskBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded

  const planned = tasks.filter(t => t.status !== 'COMPLETED');
  const completed = tasks.filter(t => t.status === 'COMPLETED');
  const allTasks = [...planned, ...completed];

  const nextTask = planned[0];
  const remainingCount = planned.length > 1 ? planned.length - 1 : 0;

  // Capture on expand/collapse for QA
  useEffect(() => {
    captureOnContentChange(expanded ? 'taskbar-expanded' : 'taskbar-collapsed');
  }, [expanded]);

  const expand = useCallback(() => {
    setExpanded(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      ...SPRING_CONFIG,
    }).start();
  }, [slideAnim]);

  const collapse = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      ...SPRING_CONFIG,
    }).start(() => {
      setExpanded(false);
    });
  }, [slideAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          collapse();
        }
      },
    })
  ).current;

  const handleQuickAdd = useCallback(() => {
    if (!newTitle.trim()) return;
    onQuickAdd(newTitle.trim());
    setNewTitle('');
  }, [newTitle, onQuickAdd]);

  // Expanded sheet translate: slides up from bottom
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [EXPANDED_MAX_HEIGHT, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  // ---- Collapsed bar ----
  const renderCollapsedBar = () => (
    <TouchableOpacity
      style={styles.collapsedBar}
      onPress={expand}
      activeOpacity={0.7}
    >
      <View style={styles.collapsedContent}>
        {/* Checkbox */}
        {nextTask ? (
          <>
            <TouchableOpacity
              style={styles.collapsedCheckbox}
              onPress={(e) => {
                e.stopPropagation?.();
                onToggle(nextTask.id);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.collapsedCheckboxInner} />
            </TouchableOpacity>
            <Text style={styles.collapsedTitle} numberOfLines={1}>
              {nextTask.title}
            </Text>
            {remainingCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>+{remainingCount}</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.collapsedEmptyText}>All tasks done</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // ---- Expanded task row ----
  const renderTaskRow = (task: Activity) => {
    const isDone = task.status === 'COMPLETED';
    const catColor = getCategoryColor(task.category_id);

    return (
      <TouchableOpacity
        key={task.id}
        style={[styles.taskRow, isDone && styles.taskRowDone]}
        onPress={() => onPress(task.id)}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={[styles.expandedCheckbox, isDone && styles.expandedCheckboxDone]}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggle(task.id);
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {isDone && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text
          style={[styles.taskTitle, isDone && styles.taskTitleDone]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        <View style={[styles.categoryDot, { backgroundColor: catColor.solid }]} />
      </TouchableOpacity>
    );
  };

  // ---- Expanded sheet ----
  const renderExpandedSheet = () => (
    <Modal
      visible={expanded}
      transparent
      animationType="none"
      onRequestClose={collapse}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={collapse}>
        <Animated.View
          style={[styles.backdropFill, { opacity: backdropOpacity }]}
        />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.expandedSheet,
          { transform: [{ translateY }], maxHeight: EXPANDED_MAX_HEIGHT },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag handle */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* Task list */}
        <ScrollView
          style={styles.taskList}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {allTasks.map(renderTaskRow)}

          {/* + Subtask add button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Focus the text input if empty, otherwise submit
              if (newTitle.trim()) {
                handleQuickAdd();
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.addCircle}>
              <Text style={styles.addCircleText}>+</Text>
            </View>
          </TouchableOpacity>

          {/* Quick add input */}
          <View style={styles.quickAddRow}>
            <TextInput
              style={styles.quickAddInput}
              placeholder="Add task..."
              placeholderTextColor={colors.muted}
              value={newTitle}
              onChangeText={setNewTitle}
              onSubmitEditing={handleQuickAdd}
              returnKeyType="done"
              maxLength={80}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderCollapsedBar()}
      {renderExpandedSheet()}
    </View>
  );
}

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const styles = StyleSheet.create({
  container: {
    // Positioned by parent above tab bar
  },

  // ---- Collapsed ----
  collapsedBar: {
    height: COLLAPSED_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(224,217,206,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collapsedCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedCheckboxInner: {
    // empty inner for the unchecked state
  },
  collapsedTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#4A4540',
  },
  collapsedEmptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  countBadge: {
    backgroundColor: '#E3ECE6',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  countBadgeText: {
    fontFamily: monoFont,
    fontSize: 10,
    color: '#2D5A3E',
    fontWeight: '600',
  },

  // ---- Expanded ----
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  expandedSheet: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // safe area bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DED6CA',
    marginBottom: 12,
  },

  // ---- Task rows ----
  taskList: {
    paddingHorizontal: 20,
    maxHeight: EXPANDED_MAX_HEIGHT - DRAG_HANDLE_HEIGHT - 80,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(224,217,206,0.4)',
  },
  taskRowDone: {
    opacity: 0.4,
  },
  expandedCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedCheckboxDone: {
    backgroundColor: colors.done,
    borderColor: colors.done,
  },
  checkmark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ---- Add button ----
  addButton: {
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  addCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },

  // ---- Quick add ----
  quickAddRow: {
    paddingBottom: 8,
  },
  quickAddInput: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
