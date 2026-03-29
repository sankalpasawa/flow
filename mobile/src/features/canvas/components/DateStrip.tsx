import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, FlatList } from 'react-native';
import type { ViewToken } from 'react-native';
import { format, addDays, subDays, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing } from '../../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CHIP_WIDTH = 52;
const CHIP_HEIGHT = 60;
const TOTAL_DAYS = 21;
const TODAY_INDEX = 7; // 7 past days, today at index 7, then 13 future

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

function buildDates(anchorDate: Date): Date[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(anchorDate, i - TODAY_INDEX));
}

const getItemLayout = (_data: unknown, index: number) => ({
  length: CHIP_WIDTH,
  offset: CHIP_WIDTH * index,
  index,
});

export function DateStrip({ selectedDate, onSelectDate }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(selectedDate);
  const flatListRef = useRef<FlatList<Date>>(null);
  const hasScrolledRef = useRef(false);
  const isUserScrollingRef = useRef(false);

  const dates = useMemo(() => buildDates(selectedDate), [selectedDate]);

  // Find the index of selectedDate in the list (should be TODAY_INDEX when freshly built)
  const selectedIndex = useMemo(() => {
    const idx = dates.findIndex((d) => isSameDay(d, selectedDate));
    return idx >= 0 ? idx : TODAY_INDEX;
  }, [dates, selectedDate]);

  // Auto-scroll to center the selected date on mount and when selection changes
  useEffect(() => {
    if (flatListRef.current) {
      // Small delay to ensure layout is ready
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: hasScrolledRef.current,
          viewPosition: 0.5, // center in viewport
        });
        hasScrolledRef.current = true;
      }, hasScrolledRef.current ? 0 : 100);
      return () => clearTimeout(timer);
    }
  }, [selectedIndex]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      if (!isUserScrollingRef.current || viewableItems.length === 0) return;

      // Pick the item closest to the center of visible items
      const middleIdx = Math.floor(viewableItems.length / 2);
      const centerItem = viewableItems[middleIdx];
      if (centerItem?.item && !isSameDay(centerItem.item as Date, selectedDate)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelectDate(centerItem.item as Date);
      }
    },
    [selectedDate, onSelectDate],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  function toggleCalendar() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCalendarOpen(!calendarOpen);
    if (!calendarOpen) setCalendarMonth(selectedDate);
  }

  function pickDate(date: Date) {
    onSelectDate(date);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCalendarOpen(false);
  }

  const renderDateChip = useCallback(
    ({ item }: { item: Date }) => {
      const isSelected = isSameDay(item, selectedDate);
      const isToday = isSameDay(item, new Date());
      return (
        <TouchableOpacity
          style={[
            styles.chip,
            isSelected && styles.chipSelected,
            isToday && !isSelected && styles.chipToday,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelectDate(item);
          }}
          accessibilityLabel={format(item, 'EEEE, MMMM d')}
          accessibilityState={{ selected: isSelected }}
        >
          <Text
            style={[
              styles.dayName,
              isSelected && styles.textSelected,
              isToday && !isSelected && styles.dayNameToday,
            ]}
          >
            {format(item, 'EEE')}
          </Text>
          <Text
            style={[
              styles.dayNum,
              isSelected && styles.textSelected,
              isToday && !isSelected && styles.dayNumToday,
            ]}
          >
            {format(item, 'd')}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedDate, onSelectDate],
  );

  const keyExtractor = useCallback((item: Date) => item.toISOString(), []);

  // Calendar grid
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <View>
      {/* Swipeable date strip */}
      <View style={styles.wrapper}>
        <FlatList
          ref={flatListRef}
          data={dates}
          renderItem={renderDateChip}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CHIP_WIDTH}
          decelerationRate="fast"
          pagingEnabled={false}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollBeginDrag={() => { isUserScrollingRef.current = true; }}
          onMomentumScrollEnd={() => { isUserScrollingRef.current = false; }}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={() => {
            // Fallback: scroll to beginning if index fails
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
          }}
        />
      </View>

      {/* Expand/collapse toggle */}
      <TouchableOpacity style={styles.toggleBar} onPress={toggleCalendar} activeOpacity={0.7}>
        <Text style={[styles.toggleChevron, calendarOpen && styles.toggleChevronUp]}>
          {calendarOpen ? '‹' : '›'}
        </Text>
      </TouchableOpacity>

      {/* Expanded calendar */}
      {calendarOpen && (
        <View style={styles.calendar}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={() => setCalendarMonth(subMonths(calendarMonth, 1))} style={styles.calNav}>
              <Text style={styles.calNavText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthLabel}>{format(calendarMonth, 'MMMM yyyy')}</Text>
            <TouchableOpacity onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))} style={styles.calNav}>
              <Text style={styles.calNavText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calWeekRow}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <Text key={d} style={styles.calWeekDay}>{d}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {calendarDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const inMonth = isSameMonth(day, calendarMonth);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.calDay, isSelected && styles.calDaySelected]}
                  onPress={() => pickDate(day)}
                >
                  <Text style={[
                    styles.calDayText,
                    !inMonth && styles.calDayMuted,
                    isSelected && styles.calDayTextSelected,
                    isToday && !isSelected && styles.calDayToday,
                  ]}>
                    {format(day, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today shortcut */}
          {!isSameDay(selectedDate, new Date()) && (
            <TouchableOpacity style={styles.todayBtn} onPress={() => pickDate(new Date())}>
              <Text style={styles.todayBtnText}>Go to Today</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 4,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
  },
  chip: {
    width: CHIP_WIDTH, height: CHIP_HEIGHT,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radii.sm,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipToday: { backgroundColor: colors.primaryBg },
  dayName: {
    fontSize: 11, fontWeight: '500', color: colors.muted,
    letterSpacing: 0.4, marginBottom: 2,
  },
  dayNameToday: { color: colors.primary },
  dayNum: { fontSize: 19, fontWeight: '600', color: colors.text },
  dayNumToday: { color: colors.primary },
  textSelected: { color: '#FFFFFF' },

  // Toggle bar
  toggleBar: {
    alignItems: 'center', paddingVertical: 2,
  },
  toggleChevron: {
    color: colors.muted, fontSize: 14,
    transform: [{ rotate: '90deg' }],
  },
  toggleChevronUp: {
    transform: [{ rotate: '-90deg' }],
  },

  // Calendar
  calendar: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 12,
  },
  calHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  calNav: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  calNavText: { color: colors.primary, fontSize: 20, fontWeight: '600' },
  calMonthLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  calWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calWeekDay: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: {
    width: '14.28%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  calDaySelected: { backgroundColor: colors.primary, borderRadius: 18 },
  calDayText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  calDayMuted: { color: colors.muted, opacity: 0.4 },
  calDayTextSelected: { color: '#fff', fontWeight: '700' },
  calDayToday: { color: colors.primary, fontWeight: '700' },
  todayBtn: {
    alignSelf: 'center', marginTop: 8,
    paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: colors.primaryBg, borderRadius: radii.pill,
  },
  todayBtnText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
});
