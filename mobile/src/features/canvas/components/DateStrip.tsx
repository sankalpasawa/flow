import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, addDays, isSameDay, subDays } from 'date-fns';
import { colors, radii } from '../../../theme';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function DateStrip({ selectedDate, onSelectDate }: Props) {
  // Show 7 days centered on selected date
  const dates = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3));

  return (
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
                {format(date, 'EEE').toUpperCase()}
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
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
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
    width: 44, height: 52,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radii.sm,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipToday: { backgroundColor: colors.primaryBg },
  dayName: {
    fontSize: 10, fontWeight: '500', color: colors.muted,
    letterSpacing: 0.4, marginBottom: 2,
  },
  dayNameToday: { color: colors.primary },
  dayNum: { fontSize: 17, fontWeight: '600', color: colors.text },
  dayNumToday: { color: colors.primary },
  textSelected: { color: '#FFFFFF' },
});
