import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';

export function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { color: '#F1F5F9', fontSize: 22, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 48, gap: 8 },
  sectionLabel: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  card: {
    backgroundColor: '#1E293B', borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    minHeight: 44,
  },
  cardLabel: { color: '#64748B', fontSize: 14 },
  cardValue: { color: '#F1F5F9', fontSize: 14, fontWeight: '500' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  proBadge: {
    backgroundColor: '#312E81', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  proBadgeText: { color: '#A5B4FC', fontSize: 12, fontWeight: '600' },
  infoBox: {
    backgroundColor: '#1E293B', borderRadius: 10, padding: 14,
  },
  infoText: { color: '#64748B', fontSize: 13, lineHeight: 19 },
  signOutButton: {
    backgroundColor: '#450A0A', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 16, minHeight: 44,
  },
  signOutText: { color: '#FCA5A5', fontSize: 16, fontWeight: '600' },
});
