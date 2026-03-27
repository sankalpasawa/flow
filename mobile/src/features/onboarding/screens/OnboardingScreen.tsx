import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../../store/authStore';
import { useActivitiesStore } from '../../../store/activitiesStore';
import { SYSTEM_CATEGORIES } from '../../categories/systemCategories';
import { format, addHours, startOfHour } from 'date-fns';

const ONBOARDING_KEY = 'dayflow_onboarded';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

interface Props {
  onComplete: () => void;
}

const STEPS = ['welcome', 'daystart', 'firstactivity'] as const;
type Step = typeof STEPS[number];

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [activityTitle, setActivityTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(SYSTEM_CATEGORIES[0].id);
  const { user } = useAuthStore();
  const { addActivity } = useActivitiesStore();

  async function finish() {
    if (step === 'firstactivity' && activityTitle.trim() && user) {
      // Create first activity starting at next hour
      const nextHour = startOfHour(addHours(new Date(), 1));
      await addActivity({
        user_id: user.id,
        title: activityTitle.trim(),
        start_time: nextHour.toISOString(),
        duration_minutes: 60,
        category_id: selectedCategory,
      }).catch((err) => {
        console.error('[DayFlow] Failed to create first activity:', err);
      });
    }
    try {
      await markOnboardingComplete();
    } catch (err) {
      console.error('[DayFlow] Failed to save onboarding status:', err);
    }
    onComplete();
  }

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else finish();
  }

  return (
    <SafeAreaView style={styles.container}>
      {step === 'welcome' && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Welcome to DayFlow</Text>
          <Text style={styles.body}>
            Plan your day in time blocks, log your experiences, and discover your
            personal energy patterns.{'\n\n'}
            Takes 2 minutes to set up.
          </Text>
          <TouchableOpacity style={styles.button} onPress={next} accessibilityLabel="Get started">
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'daystart' && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>🌅</Text>
          <Text style={styles.title}>Your Canvas Awaits</Text>
          <Text style={styles.body}>
            DayFlow shows your day as an hourly canvas — tap any slot to plan an
            activity, then log how it actually went.{'\n\n'}
            The more you log, the smarter your insights get.
          </Text>
          <TouchableOpacity style={styles.button} onPress={next} accessibilityLabel="Continue">
            <Text style={styles.buttonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'firstactivity' && (
        <ScrollView contentContainerStyle={styles.stepContainer}>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={styles.title}>Plan Your First Block</Text>
          <Text style={styles.bodySmall}>What's one thing you want to get done today?</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Deep work on project proposal"
            placeholderTextColor="#64748B"
            value={activityTitle}
            onChangeText={setActivityTitle}
            maxLength={80}
            autoFocus
            accessibilityLabel="Activity title"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {SYSTEM_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, selectedCategory === cat.id && styles.catChipSelected]}
                onPress={() => setSelectedCategory(cat.id)}
                accessibilityLabel={`Category ${cat.name}`}
                accessibilityState={{ selected: selectedCategory === cat.id }}
              >
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catName, selectedCategory === cat.id && styles.catNameSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, !activityTitle.trim() && styles.buttonDisabled]}
            onPress={finish}
            accessibilityLabel="Start planning"
          >
            <Text style={styles.buttonText}>Start Planning 🚀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={() => { markOnboardingComplete(); onComplete(); }}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  stepContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 40,
  },
  emoji: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#F1F5F9', textAlign: 'center', marginBottom: 16 },
  body: { fontSize: 17, color: '#94A3B8', textAlign: 'center', lineHeight: 26, marginBottom: 40 },
  bodySmall: { fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
  button: {
    backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 16,
    paddingHorizontal: 48, alignItems: 'center', minHeight: 44, width: '100%',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  input: {
    backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 14, color: '#F1F5F9', fontSize: 16,
    width: '100%', marginBottom: 20, minHeight: 44,
  },
  label: { color: '#64748B', fontSize: 13, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 10 },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, justifyContent: 'center',
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1E293B', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12,
    minHeight: 44,
  },
  catChipSelected: { backgroundColor: '#312E81' },
  catIcon: { fontSize: 16 },
  catName: { color: '#94A3B8', fontSize: 13 },
  catNameSelected: { color: '#A5B4FC', fontWeight: '600' },
  skipButton: { marginTop: 16, minHeight: 44, justifyContent: 'center' },
  skipText: { color: '#475569', fontSize: 14 },
});
