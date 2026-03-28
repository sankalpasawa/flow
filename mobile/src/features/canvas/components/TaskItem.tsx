import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, getCategoryColor } from '../../../theme';
import { Activity } from '../../../types';

interface Props {
  task: Activity;
  onPress: () => void;
  onToggle: () => void;
  isOverdue?: boolean;
}

export function TaskItem({ task, onPress, onToggle, isOverdue }: Props) {
  const isDone = task.status === 'COMPLETED';
  const catColor = getCategoryColor(task.category_id);
  const subtasksDone = task.subtasks.filter(s => s.done).length;
  const subtasksTotal = task.subtasks.length;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <TouchableOpacity
        style={[styles.checkbox, isDone && styles.checkboxDone]}
        onPress={(e) => { e.stopPropagation?.(); onToggle(); }}
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.done, borderColor: colors.done },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  title: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '400' },
  titleDone: { textDecorationLine: 'line-through', color: colors.muted },
  subtaskCount: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  overdueDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
});
