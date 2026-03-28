import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';

export function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  async function handleSignOut() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to sign out?')
      : await new Promise<boolean>((resolve) => {
          const { Alert } = require('react-native');
          Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });
    if (!confirmed) return;
    try {
      await signOut();
    } catch (err) {
      console.error('[DayFlow] Sign out failed:', err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Email</Text>
          <Text style={styles.cardValue}>{user?.email}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Plan</Text>
          <View style={styles.planRow}>
            <Text style={styles.cardValue}>{user?.subscription_tier ?? 'FREE'}</Text>
            {user?.subscription_tier !== 'PRO' && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>Upgrade →</Text>
              </View>
            )}
          </View>
        </View>

        {/* App Info */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Version</Text>
          <Text style={styles.cardValue}>1.0.0 (Sprint 1)</Text>
        </View>

        {/* Data */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your data is stored locally on your device and synced to Supabase when online.
            Logs are private and never shared.
          </Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { color: '#1A1A1A', fontSize: 22, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 48, gap: 8 },
  sectionLabel: { color: '#9A9490', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    minHeight: 44,
  },
  cardLabel: { color: '#9A9490', fontSize: 14 },
  cardValue: { color: '#1A1A1A', fontSize: 14, fontWeight: '500' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  proBadge: {
    backgroundColor: '#EBF2EE', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  proBadgeText: { color: '#2D4A3E', fontSize: 12, fontWeight: '600' },
  infoBox: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14,
  },
  infoText: { color: '#9A9490', fontSize: 13, lineHeight: 19 },
  signOutButton: {
    backgroundColor: '#450A0A', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 16, minHeight: 44,
  },
  signOutText: { color: '#FCA5A5', fontSize: 16, fontWeight: '600' },
});
