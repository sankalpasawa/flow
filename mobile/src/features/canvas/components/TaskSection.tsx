import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, radii, shadows, spacing } from '../../../theme';
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
  const [expanded, setExpanded] = useState(false);

  function handleSubmit() {
    if (!newTitle.trim()) return;
    onQuickAdd(newTitle.trim());
    setNewTitle('');
  }

  const planned = tasks.filter(t => t.status !== 'COMPLETED');
  const completed = tasks.filter(t => t.status === 'COMPLETED');
  const allTasks = [...planned, ...completed];

  if (allTasks.length === 0) {
    return (
      <View style={styles.containerCompact}>
        <View style={styles.quickAddRow}>
          <Text style={styles.quickAddIcon}>+</Text>
          <TextInput
            style={styles.quickAddInput}
            placeholder="Add task..."
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

  const hasMore = allTasks.length > 1;

  return (
    <View style={styles.container}>
      {/* Header — tap to expand/collapse */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Tasks</Text>
          {planned.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{planned.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {completed.length > 0 && (
            <Text style={styles.completedText}>{completed.length} done</Text>
          )}
          {hasMore && (
            <Text style={[styles.chevron, expanded && styles.chevronUp]}>
              {expanded ? '‹' : '›'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Collapsed: show up to 3 tasks */}
      {!expanded && allTasks.slice(0, 3).map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onPress={() => onPress(task.id)}
          onToggle={() => onToggle(task.id)}
          isOverdue={task.assigned_date !== null && task.assigned_date < todayStr && task.status === 'PLANNED'}
        />
      ))}

      {/* Expanded: show all tasks in scrollable area — 60% of screen */}
      {expanded && (
        <Animated.View entering={FadeIn.duration(200)}>
          <ScrollView
            style={{ maxHeight: Dimensions.get('window').height * 0.6 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
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
          </ScrollView>
        </Animated.View>
      )}

      {/* Quick add — only when expanded */}
      {expanded && (
        <View style={styles.quickAddRow}>
          <Text style={styles.quickAddIcon}>+</Text>
          <TextInput
            style={styles.quickAddInput}
            placeholder="Add task..."
            placeholderTextColor={colors.muted}
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            maxLength={80}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerCompact: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  headerRight: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  headerTitle: {
    color: colors.text, fontSize: 14, fontWeight: '600',
    letterSpacing: 0.4,
  },
  badge: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 18,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  completedText: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  chevron: {
    color: colors.muted, fontSize: 16, fontWeight: '500',
    transform: [{ rotate: '90deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '-90deg' }],
  },
  quickAddRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 4,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  quickAddIcon: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  quickAddInput: {
    flex: 1, color: colors.text, fontSize: 13,
    paddingVertical: 4, minHeight: 28,
  },
});
