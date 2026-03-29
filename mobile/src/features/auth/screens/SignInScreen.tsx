import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { colors, radii, spacing } from '../../../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<Record<string, object>, 'SignIn'> };

export function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error, clearError } = useAuthStore();

  async function handleSignIn() {
    if (!email.trim() || !password) {
      useAuthStore.setState({ error: 'Please enter your email and password.' });
      return;
    }
    clearError();
    await signIn(email.trim().toLowerCase(), password);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>DayFlow</Text>
        <Text style={styles.subtitle}>Your day, by design.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.text2}
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
          placeholderTextColor={colors.text2}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          accessibilityLabel="Password"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignIn}
          disabled={loading}
          accessibilityLabel="Sign in"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('SignUp' as never)}
          accessibilityLabel="Create an account"
        >
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  logo: { fontSize: 36, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.text2, textAlign: 'center', marginBottom: 40 },
  errorBox: { backgroundColor: '#450A0A', borderRadius: radii.sm, padding: 12, marginBottom: 16 },
  errorText: { color: '#FCA5A5', fontSize: 14 },
  input: {
    backgroundColor: colors.surface, borderRadius: radii.sm, paddingHorizontal: spacing.lg,
    paddingVertical: 14, color: colors.text, fontSize: 16,
    marginBottom: 12, minHeight: 44,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radii.sm, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, minHeight: 44,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkButton: { marginTop: 20, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  linkText: { color: colors.text2, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '600' },
});
