import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<Record<string, object>, 'SignUp'> };

export function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading, error, clearError } = useAuthStore();

  async function handleSignUp() {
    if (!email.trim() || !password) {
      useAuthStore.setState({ error: 'Please fill in all fields.' });
      return;
    }
    if (password !== confirmPassword) {
      useAuthStore.setState({ error: 'Passwords don\'t match. Please make sure both passwords are the same.' });
      return;
    }
    if (password.length < 6) {
      useAuthStore.setState({ error: 'Password must be at least 6 characters.' });
      return;
    }
    clearError();
    await signUp(email.trim().toLowerCase(), password);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>DayFlow</Text>
        <Text style={styles.subtitle}>Start planning with intention.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          accessibilityLabel="Email address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          accessibilityLabel="Password"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#94A3B8"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          accessibilityLabel="Confirm password"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          disabled={loading}
          accessibilityLabel="Create account"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back to sign in"
        >
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontSize: 36, fontWeight: '800', color: '#6366F1', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginBottom: 40 },
  errorBox: { backgroundColor: '#450A0A', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#FCA5A5', fontSize: 14 },
  input: {
    backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 14, color: '#F1F5F9', fontSize: 16,
    marginBottom: 12, minHeight: 44,
  },
  button: {
    backgroundColor: '#6366F1', borderRadius: 10, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, minHeight: 44,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkButton: { marginTop: 20, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  linkText: { color: '#94A3B8', fontSize: 14 },
  linkBold: { color: '#6366F1', fontWeight: '600' },
});
