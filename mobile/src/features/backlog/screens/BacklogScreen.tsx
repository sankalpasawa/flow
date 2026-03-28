import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { ActivityCard } from '../../canvas/components/ActivityCard';
import { Activity } from '../../../types';

interface Props {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

export function BacklogScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { backlog, loadBacklog, quickToggleComplete } = useActivitiesStore();

  useEffect(() => {
    if (user) loadBacklog(user.id);
  }, [user]);

  const planned = backlog.filter(a => a.status !== 'COMPLETED');
  const completed = backlog.filter(a => a.status === 'COMPLETED');

  function renderItem({ item }: { item: Activity }) {
    return (
      <ActivityCard
        activity={item}
        isNow={false}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
        onQuickComplete={() => quickToggleComplete(item.id)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Someday</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ActivityForm', { backlog: true })}
          accessibilityLabel="Add task to someday"
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {planned.length === 0 && completed.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Your someday list is empty</Text>
          <Text style={styles.emptyBody}>
            Add tasks you want to do eventually but haven't scheduled yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...planned, ...completed]}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            planned.length > 0 ? (
              <Text style={styles.sectionHeader}>{planned.length} task{planned.length !== 1 ? 's' : ''}</Text>
            ) : null
          }
          stickyHeaderIndices={completed.length > 0 ? [planned.length] : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '800' },
  addButton: {
    backgroundColor: '#6366F1', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '400' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: '#64748B', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  listContent: { paddingBottom: 32, paddingTop: 8 },
  sectionHeader: {
    color: '#64748B', fontSize: 12, fontWeight: '600',
    paddingHorizontal: 16, paddingVertical: 8,
  },
});
