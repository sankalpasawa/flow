import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { searchActivities } from '../../../lib/db/activities';
import { Activity } from '../../../types';
import { colors, spacing, radii, shadows, getCategoryColor } from '../../../theme';

interface Props {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned', IN_PROGRESS: 'In progress', COMPLETED: 'Done', SKIPPED: 'Skipped',
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
    if (!text.trim()) { setResults([]); setSearched(false); return; }

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
    const catColor = getCategoryColor(item.category_id);
    const dateStr = format(parseISO(item.start_time), 'MMM d, yyyy');

    return (
      <TouchableOpacity
        style={[styles.resultCard, { backgroundColor: catColor.light, borderLeftColor: catColor.solid }, shadows.card]}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.resultRow}>
          <Text style={styles.resultIcon}>{cat?.icon ?? '📋'}</Text>
          <View style={styles.resultInfo}>
            <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.resultMeta}>
              {dateStr} · {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>
        {cat && (
          <View style={[styles.tag, { backgroundColor: catColor.solid + '18' }]}>
            <Text style={[styles.tagText, { color: catColor.solid }]}>{cat.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks, categories, status..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={doSearch}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => doSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>}

      {!loading && searched && results.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No tasks found for "{query}"</Text>
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>💡</Text>
          <Text style={styles.emptyText}>Search by title, category, or status</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {searched && results.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>{results.length} task{results.length !== 1 ? 's' : ''} found</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 22 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 12, minHeight: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 },
  clearBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: colors.muted, fontSize: 16 },
  center: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  listContent: { padding: 12, paddingBottom: 60 },
  resultCard: {
    borderLeftWidth: 4, borderRadius: radii.card,
    padding: 14, marginBottom: 8,
  },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  resultIcon: { fontSize: 18, marginTop: 1 },
  resultInfo: { flex: 1 },
  resultTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  resultMeta: { color: colors.text2, fontSize: 11 },
  tag: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  tagText: { fontSize: 10, fontWeight: '500' },
  countBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, paddingVertical: 8,
    alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border,
  },
  countText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
