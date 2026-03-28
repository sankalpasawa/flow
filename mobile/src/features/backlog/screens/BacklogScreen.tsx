import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { ActivityCard } from '../../canvas/components/ActivityCard';
import { Activity } from '../../../types';
import { colors, spacing, radii, shadows } from '../../../theme';

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
        <View>
          <Text style={styles.headerTitle}>Someday</Text>
          <Text style={styles.headerSubtitle}>{planned.length} tasks waiting</Text>
        </View>
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
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, shadows.fab]}
        onPress={() => navigation.navigate('ActivityForm', { backlog: true })}
        accessibilityLabel="Add someday task"
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 12,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '600' },
  headerSubtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: colors.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  listContent: { paddingBottom: 100, paddingTop: 8 },
  fab: {
    position: 'absolute', bottom: 96, right: 24,
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 28 },
});
