import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const VISIBLE_DAYS = 14; // 7 before + today + 6 after

export function DateStrip({ selectedDate, onSelectDate }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const today = new Date();
  const days: Date[] = [];
  for (let i = -7; i <= 7; i++) {
    days.push(addDays(today, i));
  }

  useEffect(() => {
    // Scroll to today's position
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: 7 * 64, animated: false });
    }, 100);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
          const selected = isSameDay(day, selectedDate);
          const todayDay = isToday(day);
          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[
                styles.dayPill,
                selected && styles.dayPillSelected,
                todayDay && !selected && styles.dayPillToday,
              ]}
              onPress={() => onSelectDate(day)}
              accessibilityLabel={format(day, 'EEEE, MMMM d')}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
                {format(day, 'EEE')}
              </Text>
              <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>
                {format(day, 'd')}
              </Text>
              {todayDay && <View style={[styles.todayDot, selected && styles.todayDotSelected]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  scrollContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  dayPill: {
    width: 56, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, minHeight: 64,
  },
  dayPillSelected: { backgroundColor: '#6366F1' },
  dayPillToday: { borderWidth: 1, borderColor: '#6366F1' },
  dayLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  dayLabelSelected: { color: '#C7D2FE' },
  dayNum: { color: '#94A3B8', fontSize: 18, fontWeight: '700' },
  dayNumSelected: { color: '#fff' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#6366F1', marginTop: 3 },
  todayDotSelected: { backgroundColor: '#fff' },
});
