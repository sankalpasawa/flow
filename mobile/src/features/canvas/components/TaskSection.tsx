import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii, shadows } from '../../../theme';
import { Activity } from '../../../types';
import { TaskItem } from './TaskItem';

interface Props {
  tasks: Activity[];
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
  onQuickAdd: (title: string) => void;
  todayStr: string;
}

export function TaskSection({ tasks, onToggle, onPress, onQuickAdd, todayStr }: Props) {
  const [newTitle, setNewTitle] = useState('');

  function handleSubmit() {
    if (!newTitle.trim()) return;
    onQuickAdd(newTitle.trim());
    setNewTitle('');
  }

  const planned = tasks.filter(t => t.status !== 'COMPLETED');
  const completed = tasks.filter(t => t.status === 'COMPLETED');
  const allTasks = [...planned, ...completed];

  if (allTasks.length === 0 && !newTitle) {
    return (
      <View style={styles.container}>
        <View style={styles.quickAddRow}>
          <Text style={styles.quickAddIcon}>+</Text>
          <TextInput
            style={styles.quickAddInput}
            placeholder="Add a task for today..."
            placeholderTextColor={colors.muted}
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            maxLength={80}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, shadows.card]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <Text style={styles.headerCount}>{planned.length}</Text>
      </View>

      {allTasks.map((task) => {
        const isOverdue = task.assigned_date !== null && task.assigned_date < todayStr && task.status === 'PLANNED';
        return (
          <TaskItem
            key={task.id}
            task={task}
            onPress={() => onPress(task.id)}
            onToggle={() => onToggle(task.id)}
            isOverdue={isOverdue}
          />
        );
      })}

      <View style={styles.quickAddRow}>
        <Text style={styles.quickAddIcon}>+</Text>
        <TextInput
          style={styles.quickAddInput}
          placeholder="Add a task..."
          placeholderTextColor={colors.muted}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          maxLength={80}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginHorizontal: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  headerCount: {
    color: colors.muted, fontSize: 12, fontWeight: '600',
    backgroundColor: colors.surface2, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  quickAddRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  quickAddIcon: { color: colors.primary, fontSize: 18, fontWeight: '600' },
  quickAddInput: {
    flex: 1, color: colors.text, fontSize: 14,
    paddingVertical: 6, minHeight: 36,
  },
});
