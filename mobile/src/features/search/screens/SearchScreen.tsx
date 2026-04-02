import React, { useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { searchActivities } from '../../../lib/db/activities';
import { sendCommand } from '../../../lib/ai';
import { buildContext } from '../../../lib/ai/commandLayer';
import { Activity, Category } from '../../../types';
import { colors, spacing, radii, shadows, getCategoryColor } from '../../../theme';
import { getCategories } from '../../../lib/db/categories';
import { SYSTEM_CATEGORIES } from '../../categories/systemCategories';

interface Props {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export function SearchScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { activities } = useActivitiesStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Activity[]>([]);
  const [llmHtml, setLlmHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);
  const [llmWebviewHeight, setLlmWebviewHeight] = useState(200);

  // Load categories
  React.useEffect(() => {
    if (!user) return;
    getCategories(user.id).then((cats) => {
      if (cats.length > 0) setCategories(cats);
    }).catch(() => {});
  }, [user]);

  const doSearch = useCallback((text: string) => {
    setQuery(text);
    setLlmHtml(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); setSearched(false); return; }

    debounceRef.current = setTimeout(async () => {
      if (!user) return;
      setLoading(true);
      try {
        // 1. Local text search first
        const res = await searchActivities(user.id, text);
        setResults(res);
        setSearched(true);

        // 2. If few results or query looks like a question, ask LLM
        const isQuestion = /\?|how|what|when|show|tell|why|which|am i|do i/i.test(text);
        if (res.length < 2 || isQuestion) {
          const context = buildContext('light', activities, categories, new Date());
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

          try {
            const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/command`;
            const llmRes = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
              },
              body: JSON.stringify({ text: text.trim(), user_id: user.id, context, mode: 'play' }),
              signal: controller.signal,
            });
            clearTimeout(timeout);

            if (llmRes.ok) {
              const data = await llmRes.json();
              if (data.html && !data.error) {
                setLlmHtml(data.html);
              }
            }
          } catch {
            // LLM failed silently, local results still shown
          }
        }
      } catch (err) {
        console.error('[Search] failed:', err);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [user, activities, categories]);

  // Glass pill tint (same as ActivityCard)
  function glassTint(catHex: string): string {
    const r = parseInt(catHex.slice(1, 3), 16);
    const g = parseInt(catHex.slice(3, 5), 16);
    const b = parseInt(catHex.slice(5, 7), 16);
    const tint = 0.12;
    const fR = Math.round(255 * (1 - tint) + r * tint);
    const fG = Math.round(255 * (1 - tint) + g * tint);
    const fB = Math.round(255 * (1 - tint) + b * tint);
    return `rgba(${fR},${fG},${fB},0.68)`;
  }

  function renderItem({ item }: { item: Activity }) {
    const cat = item.category;
    const catColor = getCategoryColor(item.category_id);
    const tintColor = cat?.color || catColor.solid;
    const dateStr = item.start_time ? format(parseISO(item.start_time), 'EEE, MMM d · h:mm a') : item.assigned_date || 'No date';
    const isDone = item.status === 'COMPLETED';
    const isSkipped = item.status === 'SKIPPED';

    return (
      <TouchableOpacity
        style={[styles.pill, { backgroundColor: glassTint(tintColor) }, (isDone || isSkipped) && styles.pillDone]}
        onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.pillRow}>
          <Text style={styles.pillIcon}>{cat?.icon ?? '📋'}</Text>
          <Text style={[styles.pillTitle, isDone && styles.pillTitleDone]} numberOfLines={1}>{item.title}</Text>
        </View>
        {item.mindset_prompt ? (
          <Text style={styles.pillMindset} numberOfLines={1}>{item.mindset_prompt}</Text>
        ) : null}
        <View style={styles.pillMeta}>
          <Text style={styles.pillDate}>{dateStr}</Text>
          {cat && <Text style={[styles.pillCat, { color: tintColor }]}>{cat.name}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  const LLM_CSS = `
    :root { --bg:#F5F0E8;--surface:rgba(255,255,255,0.65);--surface-border:rgba(255,255,255,0.75);--text:#1A1714;--text2:#4A4540;--muted:#8C857D;--border:#E0D9CE;--primary:#2D5A3E;--primary-bg:#E3ECE6;--accent:#C4795B;--accent-bg:rgba(196,121,91,0.12);--shadow:0 3px 8px rgba(0,0,0,0.06); }
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,'Helvetica Neue',sans-serif;background:var(--bg);color:var(--text);padding:12px 16px;line-height:1.5;-webkit-font-smoothing:antialiased;}
    .card{background:var(--surface);border:1px solid var(--surface-border);border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:var(--shadow);}
    h2{font-size:16px;font-weight:700;margin-bottom:4px;}
    h3{font-size:13px;font-weight:700;margin-bottom:3px;}
    p{font-size:12px;color:var(--text2);margin-bottom:6px;}
    .muted{color:var(--muted);font-size:10px;}
    .chip{display:inline-block;background:var(--primary-bg);color:var(--primary);font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;margin-right:4px;}
    .stat{display:flex;align-items:baseline;gap:4px;}.stat-value{font-size:22px;font-weight:700;color:var(--primary);}.stat-label{font-size:10px;color:var(--muted);}
    .mindset{font-size:10px;font-style:italic;color:var(--text2);opacity:0.7;}
  `;

  const llmFullHtml = llmHtml ? `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>${LLM_CSS}</style></head><body>${llmHtml}</body></html>` : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search or ask anything..."
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

      {!loading && searched && results.length === 0 && !llmHtml && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.center}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
          <Text style={styles.emptyText}>Search by name, or ask a question</Text>
          <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>
            Try "gym this week" or "what should I focus on?"
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          llmHtml ? (
            <View style={styles.llmSection}>
              <Text style={styles.llmLabel}>AI Answer</Text>
              <View style={[styles.llmCard, { height: llmWebviewHeight }]}>
                <WebView
                  source={{ html: llmFullHtml }}
                  style={{ flex: 1, backgroundColor: 'transparent' }}
                  scrollEnabled={false}
                  javaScriptEnabled={true}
                  injectedJavaScript={`
                    (function(){
                      function p(){window.ReactNativeWebView.postMessage(JSON.stringify({h:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)+16}))}
                      p();setTimeout(p,200);setTimeout(p,500);
                    })();true;
                  `}
                  onMessage={(e) => {
                    try {
                      const { h } = JSON.parse(e.nativeEvent.data);
                      if (h > 0) setLlmWebviewHeight(h);
                    } catch {}
                  }}
                />
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={
          searched && results.length > 0 ? (
            <Text style={styles.countText}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
          ) : null
        }
      />
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
  backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 22 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.glass.bg, borderRadius: 22, borderWidth: 1, borderColor: colors.glass.border,
    paddingHorizontal: 14, minHeight: 44,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500', paddingVertical: 10 },
  clearBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: colors.muted, fontSize: 16 },
  center: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  listContent: { padding: 12, paddingBottom: 60 },

  // Glass pill results (matching Today canvas style)
  pill: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pillDone: { opacity: 0.6 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillIcon: { fontSize: 15 },
  pillTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  pillTitleDone: { textDecorationLine: 'line-through', color: colors.muted },
  pillMindset: {
    fontSize: 9.5, fontStyle: 'italic', color: colors.text2,
    opacity: 0.6, lineHeight: 13, marginTop: 2,
  },
  pillMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6,
  },
  pillDate: {
    fontSize: 10, fontWeight: '600', color: colors.muted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pillCat: { fontSize: 10, fontWeight: '600' },

  // LLM answer section
  llmSection: { marginBottom: 16 },
  llmLabel: {
    fontSize: 11, fontWeight: '700', color: colors.accent,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
  },
  llmCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
  },

  countText: {
    color: colors.muted, fontSize: 11, fontWeight: '600',
    textAlign: 'center', paddingVertical: 12,
  },
});
