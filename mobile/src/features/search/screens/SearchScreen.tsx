import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { searchActivities } from '../../../lib/db/activities';
import { Activity } from '../../../types';

interface Props {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#94A3B8', IN_PROGRESS: '#F59E0B', COMPLETED: '#10B981', SKIPPED: '#475569',
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned', IN_PROGRESS: 'In progress', COMPLETED: 'Done', SKIPPED: 'Skipped',
};

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: '', DAILY: 'Daily', WEEKDAYS: 'Weekdays', WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2w', TRIWEEKLY: 'Every 3w', MONTHLY: 'Monthly',
  BIMONTHLY: 'Every 2mo', QUARTERLY: 'Quarterly', BIANNUAL: 'Every 6mo', YEARLY: 'Yearly',
};

export function SearchScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await searchActivities(user.id, text);
        setResults(res);
        setSearched(true);
      } catch (err) {
        console.error('[DayFlow] Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [user]);

  function renderItem({ item }: { item: Activity }) {
    const cat = item.category;
    const dateStr = format(parseISO(item.start_time), 'MMM d, yyyy');
    const timeStr = format(parseISO(item.start_time), 'h:mm a');
    const recurrence = RECURRENCE_LABELS[item.recurrence_type] || '';

    return (
      <TouchableOpacity
        style={[styles.resultCard, { borderLeftColor: cat?.color ?? '#6366F1' }]}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
        activeOpacity={0.85}
        accessibilityLabel={`${item.title}, ${item.status}`}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultIcon}>{cat?.icon ?? '📋'}</Text>
          <View style={styles.resultInfo}>
            <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.resultMeta}>
              <Text style={styles.resultDate}>{dateStr} · {timeStr}</Text>
              <Text style={[styles.resultStatus, { color: STATUS_COLORS[item.status] }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.resultTags}>
          {cat && (
            <View style={[styles.tag, { backgroundColor: cat.color + '22' }]}>
              <Text style={[styles.tagText, { color: cat.color }]}>{cat.name}</Text>
            </View>
          )}
          {recurrence ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>🔄 {recurrence}</Text>
            </View>
          ) : null}
          <View style={styles.tag}>
            <Text style={styles.tagText}>{formatDuration(item.duration_minutes)}</Text>
          </View>
        </View>
        {item.mindset_prompt ? (
          <Text style={styles.resultMindset} numberOfLines={1}>✨ {item.mindset_prompt}</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks, categories, status..."
            placeholderTextColor="#475569"
            value={query}
            onChangeText={doSearch}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Search tasks"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => doSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#6366F1" />
        </View>
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No tasks found for "{query}"</Text>
          <Text style={styles.emptyHint}>Try searching by title, category, or status</Text>
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💡</Text>
          <Text style={styles.emptyText}>Search your tasks</Text>
          <Text style={styles.emptyHint}>
            Search by title, category (Health, Deep Work...),{'\n'}
            status (completed, planned...),{'\n'}
            or frequency (weekly, monthly...)
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {searched && results.length > 0 && (
        <View style={styles.resultCount}>
          <Text style={styles.resultCountText}>{results.length} task{results.length !== 1 ? 's' : ''} found</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#F1F5F9', fontSize: 22 },
  searchInputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', borderRadius: 10,
    paddingHorizontal: 12, minHeight: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#F1F5F9', fontSize: 15, paddingVertical: 10 },
  clearBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: '#475569', fontSize: 16 },
  loadingContainer: { paddingTop: 40, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#F1F5F9', fontSize: 17, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  emptyHint: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  listContent: { padding: 12, paddingBottom: 60 },
  resultCard: {
    backgroundColor: '#1E293B', borderLeftWidth: 4, borderRadius: 8,
    padding: 12, marginBottom: 8,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  resultIcon: { fontSize: 18, marginTop: 1 },
  resultInfo: { flex: 1 },
  resultTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '600', marginBottom: 3 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultDate: { color: '#64748B', fontSize: 12 },
  resultStatus: { fontSize: 12, fontWeight: '600' },
  resultTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: '#0F172A', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
  resultMindset: { color: '#6366F1', fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  resultCount: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1E293B', paddingVertical: 8,
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#334155',
  },
  resultCountText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
});
