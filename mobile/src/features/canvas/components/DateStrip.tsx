import React from 'react';
import { Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { colors, radii } from '../../../theme';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function DateStrip({ selectedDate, onSelectDate }: Props) {
  const startDate = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), -7);
  const dates = Array.from({ length: 21 }, (_, i) => addDays(startDate, i));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
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
            <Text style={[styles.dayName, isSelected && styles.textSelected]}>
              {format(date, 'EEE').toUpperCase()}
            </Text>
            <Text style={[styles.dayNum, isSelected && styles.textSelected]}>
              {format(date, 'd')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 8, paddingVertical: 8 },
  chip: {
    minWidth: 48, height: 62,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radii.card, paddingHorizontal: 6,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipToday: { backgroundColor: colors.surface2 },
  dayName: {
    fontSize: 11, fontWeight: '500', color: colors.muted,
    letterSpacing: 0.5, marginBottom: 4,
  },
  dayNum: { fontSize: 20, fontWeight: '600', color: colors.text },
  textSelected: { color: '#FFFFFF' },
});
