import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { format, addDays, subDays, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { colors, radii, spacing } from '../../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function DateStrip({ selectedDate, onSelectDate }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(selectedDate);

  // 7 days centered on selected
  const dates = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3));

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

  // Calendar grid
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <View>
      {/* Week strip */}
      <View style={styles.wrapper}>
        <TouchableOpacity
          onPress={() => onSelectDate(subDays(selectedDate, 1))}
          style={styles.arrow}
          accessibilityLabel="Previous day"
        >
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.daysRow}>
          {dates.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                  isToday && !isSelected && styles.chipToday,
                ]}
                onPress={() => onSelectDate(date)}
                accessibilityLabel={format(date, 'EEEE, MMMM d')}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.dayName, isSelected && styles.textSelected, isToday && !isSelected && styles.dayNameToday]}>
                  {format(date, 'EEE')}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.textSelected, isToday && !isSelected && styles.dayNumToday]}>
                  {format(date, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => onSelectDate(addDays(selectedDate, 1))}
          style={styles.arrow}
          accessibilityLabel="Next day"
        >
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  arrow: {
    width: 28, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20, fontWeight: '500', color: colors.muted,
  },
  daysRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  chip: {
    width: 48, height: 60,
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
