import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withSequence, FadeIn, FadeInDown,
} from 'react-native-reanimated';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { colors, spacing, radii, shadows } from '../../../theme';
import { buildContext } from '../../../lib/ai/commandLayer';
import { Category } from '../../../types';
import { getCategories } from '../../../lib/db/categories';
import { SYSTEM_CATEGORIES } from '../../categories/systemCategories';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design tokens injected into AI-generated HTML ───────────────
const DESIGN_TOKENS_CSS = `
  :root {
    --bg: #F5F0E8;
    --surface: rgba(255,255,255,0.65);
    --surface-border: rgba(255,255,255,0.75);
    --text: #1A1714;
    --text2: #4A4540;
    --muted: #8C857D;
    --border: #E0D9CE;
    --primary: #2D5A3E;
    --primary-light: #3E7A55;
    --primary-bg: #E3ECE6;
    --accent: #C4795B;
    --accent-bg: rgba(196,121,91,0.12);
    --terra: #B5634A;
    --sage: #5A8C6A;
    --slate: #3D5F80;
    --mauve: #7D5A7C;
    --amber: #A67B0A;
    --radius-md: 14px;
    --shadow: 0 3px 8px rgba(0,0,0,0.06);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Helvetica Neue', sans-serif;
    background: var(--bg);
    color: var(--text);
    padding: 16px 20px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    background: var(--surface);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: var(--shadow);
  }
  .card-accent { border-left: 3px solid var(--accent); }
  .card-primary { border-left: 3px solid var(--primary); }
  h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 8px; }
  h2 { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
  h3 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  p { font-size: 13px; color: var(--text2); margin-bottom: 8px; }
  .muted { color: var(--muted); font-size: 11px; }
  .accent { color: var(--accent); }
  .primary { color: var(--primary); }
  .chip {
    display: inline-block;
    background: var(--primary-bg);
    color: var(--primary);
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    margin-right: 6px;
    margin-bottom: 6px;
  }
  .chip-accent { background: var(--accent-bg); color: var(--accent); }
  .stat { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
  .stat-value { font-size: 28px; font-weight: 700; color: var(--primary); }
  .stat-label { font-size: 11px; color: var(--muted); font-weight: 500; }
  .progress-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin: 8px 0; }
  .progress-fill { height: 100%; border-radius: 3px; background: var(--primary); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .divider { height: 1px; background: var(--border); margin: 12px 0; }
  .emoji { font-size: 20px; margin-right: 8px; }
  .sparkline { display: flex; align-items: flex-end; gap: 3px; height: 40px; margin: 8px 0; }
  .sparkline-bar { flex: 1; background: var(--primary); border-radius: 2px; opacity: 0.7; min-height: 4px; }
  .list-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .list-item:last-child { border-bottom: none; }
  .dot { width: 8px; height: 8px; border-radius: 4px; flex-shrink: 0; }
  .mindset { font-size: 11px; font-style: italic; color: var(--text2); opacity: 0.7; margin-top: 2px; }
`;

// ─── Local HTML generator ────────────────────────────────────────

function generateLocalHtml(query: string, activities: any[], categories: Category[]): string {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lower = query.toLowerCase();

  const todayActs = activities.filter(a => {
    if (!a.start_time) return a.assigned_date === today;
    return a.start_time.startsWith(today);
  });

  const completed = todayActs.filter(a => a.status === 'COMPLETED');
  const planned = todayActs.filter(a => a.status === 'PLANNED');
  const skipped = todayActs.filter(a => a.status === 'SKIPPED');
  const totalMinutes = todayActs.reduce((sum: number, a: any) => sum + (a.duration_minutes || 0), 0);
  const completedMinutes = completed.reduce((sum: number, a: any) => sum + (a.duration_minutes || 0), 0);
  const completionRate = todayActs.length > 0 ? Math.round((completed.length / todayActs.length) * 100) : 0;

  const catCounts: Record<string, number> = {};
  todayActs.forEach((a: any) => {
    const cat = categories.find(c => c.id === a.category_id);
    catCounts[cat?.name || 'Other'] = (catCounts[cat?.name || 'Other'] || 0) + 1;
  });

  let morning = 0, afternoon = 0, evening = 0;
  todayActs.forEach((a: any) => {
    if (!a.start_time) return;
    const h = new Date(a.start_time).getHours();
    if (h < 12) morning++; else if (h < 17) afternoon++; else evening++;
  });
  const timeTotal = morning + afternoon + evening || 1;

  if (lower.includes('how was') || lower.includes('my day') || lower.includes('summary')) {
    return `
      <div class="card"><h2><span class="emoji">📊</span> Today's Summary</h2>
        <div class="grid"><div><div class="stat"><span class="stat-value">${todayActs.length}</span><span class="stat-label">activities</span></div></div>
        <div><div class="stat"><span class="stat-value">${completionRate}%</span><span class="stat-label">completed</span></div></div></div>
        <div class="progress-bar"><div class="progress-fill" style="width: ${completionRate}%"></div></div>
        <p class="muted">${completed.length} done · ${planned.length} remaining · ${skipped.length} skipped</p></div>
      <div class="card"><h3><span class="emoji">⏱</span> Time Invested</h3>
        <div class="stat"><span class="stat-value">${Math.round(completedMinutes / 60 * 10) / 10}h</span><span class="stat-label">of ${Math.round(totalMinutes / 60 * 10) / 10}h planned</span></div></div>
      <div class="card"><h3><span class="emoji">🕐</span> Time Distribution</h3>
        <div class="sparkline"><div class="sparkline-bar" style="height: ${Math.round(morning / timeTotal * 100)}%"></div><div class="sparkline-bar" style="height: ${Math.round(afternoon / timeTotal * 100)}%"></div><div class="sparkline-bar" style="height: ${Math.round(evening / timeTotal * 100)}%"></div></div>
        <p class="muted">Morning ${morning} · Afternoon ${afternoon} · Evening ${evening}</p></div>
      ${Object.keys(catCounts).length > 0 ? `<div class="card"><h3><span class="emoji">📂</span> Categories</h3>${Object.entries(catCounts).map(([name, count]) => `<div class="list-item"><div class="dot" style="background: var(--primary)"></div><div style="flex:1"><p style="margin:0">${name}</p></div><span class="chip">${count}</span></div>`).join('')}</div>` : ''}`;
  }

  if (lower.includes('focus') || lower.includes('what should')) {
    const nextPlanned = planned.filter((a: any) => a.start_time).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
    const next = nextPlanned[0];
    return `
      <div class="card card-primary"><h2><span class="emoji">🎯</span> Focus Right Now</h2>
        ${next ? `<div class="stat"><span class="stat-value">${next.title}</span></div><p>${next.start_time ? new Date(next.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No specific time'} · ${next.duration_minutes || 30}min</p>${next.mindset_prompt ? `<p class="mindset">"${next.mindset_prompt}"</p>` : ''}` : `<p>All caught up! Nothing remaining.</p>`}</div>
      <div class="card"><h3><span class="emoji">📋</span> Still Remaining</h3>
        ${planned.length > 0 ? planned.slice(0, 5).map((a: any) => `<div class="list-item"><div class="dot" style="background: var(--accent)"></div><div style="flex:1"><p style="margin:0">${a.title}</p></div></div>`).join('') : '<p class="muted">Nothing left. Nice work.</p>'}</div>`;
  }

  if (lower.includes('energy') || lower.includes('pattern')) {
    return `<div class="card"><h2><span class="emoji">⚡</span> Energy Patterns</h2><p>Based on your ${todayActs.length} activities today:</p>
      <div class="sparkline"><div class="sparkline-bar" style="height: ${morning > 0 ? 80 : 20}%"></div><div class="sparkline-bar" style="height: ${afternoon > 0 ? 60 : 20}%"></div><div class="sparkline-bar" style="height: ${evening > 0 ? 40 : 20}%"></div></div>
      <p class="muted">Morning · Afternoon · Evening</p><div class="divider"></div><p class="mindset">Log mood and energy after activities to build a real energy curve.</p></div>`;
  }

  if (lower.includes('overcommit') || lower.includes('too much')) {
    return `<div class="card ${todayActs.length > 8 ? 'card-accent' : 'card-primary'}"><h2><span class="emoji">${todayActs.length > 8 ? '⚠️' : '✅'}</span> Commitment Check</h2>
      <div class="stat"><span class="stat-value">${todayActs.length}</span><span class="stat-label">activities today</span></div>
      <div class="stat"><span class="stat-value">${Math.round(totalMinutes / 60 * 10) / 10}h</span><span class="stat-label">total time</span></div>
      <div class="divider"></div><p class="mindset">${todayActs.length > 8 ? 'That\'s a lot. Which 3 things matter most?' : 'Looks manageable. Stay focused.'}</p></div>`;
  }

  if (lower.includes('tomorrow') || lower.includes('plan')) {
    return `<div class="card"><h2><span class="emoji">📅</span> Tomorrow Planning</h2><p>Review today first:</p>
      <div class="grid"><div><div class="stat"><span class="stat-value">${completed.length}</span><span class="stat-label">completed</span></div></div><div><div class="stat"><span class="stat-value">${planned.length}</span><span class="stat-label">carry over?</span></div></div></div>
      <div class="divider"></div><p class="mindset">What's the one thing that, if done tomorrow, makes everything else easier?</p></div>`;
  }

  return `<div class="card"><h2><span class="emoji">👋</span> Here's what I see</h2>
    <div class="stat"><span class="stat-value">${todayActs.length}</span><span class="stat-label">activities today</span></div>
    <p>${completed.length} completed · ${planned.length} planned · ${totalMinutes}min total</p></div>
    <div class="card"><p class="muted">Try asking:</p><span class="chip">How was my day?</span><span class="chip">What should I focus on?</span><span class="chip">Am I overcommitting?</span></div>`;
}

// ─── Types ───────────────────────────────────────────────────────

interface ChatEntry {
  id: string;
  query: string;
  html: string;
  timestamp: Date;
}

// ─── Component ───────────────────────────────────────────────────

export function PlayScreen() {
  const { user } = useAuthStore();
  const { activities } = useActivitiesStore();

  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(SYSTEM_CATEGORIES);
  const [webviewHeights, setWebviewHeights] = useState<Record<string, number>>({});
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Mic animation
  const micScale = useSharedValue(1);
  const micAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  useEffect(() => {
    if (!user) return;
    getCategories(user.id).then((cats) => {
      if (cats.length > 0) setCategories(cats);
    }).catch(() => {});
  }, [user]);

  // Auto-scroll to bottom when new entry added
  useEffect(() => {
    if (entries.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [entries.length]);

  const processQuery = useCallback(async (query: string) => {
    if (!query.trim() || !user) return;

    setProcessing(true);
    setError(null);
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const context = buildContext('light', activities, categories, new Date());
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/command`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({ text: query.trim(), user_id: user.id, context, mode: 'play' }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      if (data.error === 'quota_exceeded') throw new Error('quota');

      let html = '';
      if (data.html) html = data.html;
      else if (data.message && data.message !== 'AI not configured. Creating as-is.') {
        html = `<div class="card"><p>${data.message}</p></div>`;
      } else throw new Error('no-ai');

      setEntries(prev => [...prev, { id: Date.now().toString(), query: query.trim(), html, timestamp: new Date() }]);
    } catch (err: any) {
      console.log('[Play] Fallback:', err.message);
      const html = generateLocalHtml(query.trim(), activities, categories);
      setEntries(prev => [...prev, { id: Date.now().toString(), query: query.trim(), html, timestamp: new Date() }]);
    } finally {
      setProcessing(false);
    }
  }, [user, activities, categories]);

  const handleSend = useCallback(async () => {
    await processQuery(inputText);
  }, [inputText, processQuery]);

  const handleMicPress = useCallback(() => {
    micScale.value = withSequence(
      withSpring(1.2, { damping: 5, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    inputRef.current?.focus();
  }, []);

  const handleClear = useCallback(() => {
    setEntries([]);
    setInputText('');
    setError(null);
  }, []);

  const buildFullHtml = (html: string) => `
    <!DOCTYPE html>
    <html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <style>${DESIGN_TOKENS_CSS}</style>
    </head><body>${html}</body></html>
  `;

  const hasEntries = entries.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Play</Text>
        {hasEntries && (
          <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {hasEntries ? (
          /* ─── Chat history ─── */
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {entries.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.duration(300).springify().damping(15)}
              >
                {/* Query bubble */}
                <View style={styles.queryRow}>
                  <View style={styles.queryBubble}>
                    <Text style={styles.queryText}>{entry.query}</Text>
                  </View>
                </View>

                {/* Response WebView */}
                <View style={[styles.responseCard, { height: webviewHeights[entry.id] || 280 }]}>
                  <WebView
                    source={{ html: buildFullHtml(entry.html) }}
                    style={styles.responseWebview}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    injectedJavaScript={`
                      (function() {
                        function postHeight() {
                          var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
                          window.ReactNativeWebView.postMessage(JSON.stringify({ height: h + 20 }));
                        }
                        postHeight();
                        setTimeout(postHeight, 200);
                        setTimeout(postHeight, 500);
                      })();
                      true;
                    `}
                    onMessage={(event) => {
                      try {
                        const { height } = JSON.parse(event.nativeEvent.data);
                        if (height > 0) {
                          setWebviewHeights(prev => ({ ...prev, [entry.id]: height }));
                        }
                      } catch {}
                    }}
                  />
                </View>

                {/* Divider between entries */}
                {index < entries.length - 1 && (
                  <View style={styles.entryDivider}>
                    <View style={styles.dividerLine} />
                  </View>
                )}
              </Animated.View>
            ))}

            {/* Processing indicator */}
            {processing && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.processingRow}>
                <View style={styles.processingBubble}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.processingText}>Thinking...</Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        ) : (
          /* ─── Empty state: mic + suggestions ─── */
          <View style={styles.centerContent}>
            <Animated.View style={micAnimStyle}>
              <TouchableOpacity style={styles.micButton} onPress={handleMicPress} activeOpacity={0.8}>
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.micIcon}>🎙</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.hint}>
              {processing ? 'Thinking...' : 'Tap to speak, or type below'}
            </Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.suggestionsWrap}>
              {[
                'How was my day?',
                'What should I focus on?',
                'Show my energy patterns',
                'Am I overcommitting?',
                'Plan tomorrow',
              ].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestion}
                  onPress={() => { setInputText(s); processQuery(s); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input bar — always at bottom */}
        <View style={styles.inputBar}>
          {hasEntries && (
            <TouchableOpacity onPress={handleMicPress} style={styles.inlineMic} activeOpacity={0.7}>
              <Text style={styles.inlineMicText}>🎙</Text>
            </TouchableOpacity>
          )}
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder={hasEntries ? 'Ask something else...' : 'Ask DayFlow anything...'}
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || processing) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || processing}
            activeOpacity={0.7}
          >
            {processing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },

  // Chat scroll
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 16,
    paddingTop: 8,
  },

  // Query bubble (right-aligned, like iMessage)
  queryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    marginTop: 8,
  },
  queryBubble: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  queryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // Response card
  responseCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  responseWebview: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Divider between entries
  entryDivider: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  dividerLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
  },

  // Processing
  processingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  processingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.glass.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  processingText: {
    fontSize: 13,
    color: colors.muted,
    fontStyle: 'italic',
  },

  // Empty state
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
    marginBottom: 16,
  },
  micIcon: {
    fontSize: 32,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 32,
  },
  errorText: {
    fontSize: 12,
    color: colors.accent,
    marginBottom: 16,
  },

  // Suggestions
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  suggestion: {
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text2,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  inlineMic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineMicText: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
