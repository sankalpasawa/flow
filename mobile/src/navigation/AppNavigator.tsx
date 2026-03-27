import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { seedSystemCategories } from '../lib/db/categories';
import { requestNotificationPermission, addNotificationResponseListener } from '../lib/notifications';
import {
  hasCompletedOnboarding, OnboardingScreen,
} from '../features/onboarding/screens/OnboardingScreen';

// Screens
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { CanvasScreen } from '../features/canvas/screens/CanvasScreen';
import { ActivityFormScreen } from '../features/canvas/screens/ActivityFormScreen';
import { ActivityDetailScreen } from '../features/canvas/screens/ActivityDetailScreen';
import { LogFormScreen } from '../features/log/screens/LogFormScreen';
import { LogHistoryScreen } from '../features/log/screens/LogHistoryScreen';
import { SettingsScreen } from '../features/canvas/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = { Canvas: '📅', Logs: '📓', Settings: '⚙️' };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name] ?? '•'}</Text>;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Canvas" component={CanvasScreen} />
      <Tab.Screen name="Logs" component={LogHistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading, initialize } = useAuthStore();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initialize();
      await seedSystemCategories();
      setDbReady(true);
    })();
  }, []);

  useEffect(() => {
    if (user) {
      hasCompletedOnboarding().then(setOnboarded);
      requestNotificationPermission();
    }
  }, [user]);

  // Handle notification taps
  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'log_nudge' && data?.activity_id) {
        // Navigation handled via ref or deep link — log for now
        console.log('[Notification] Log nudge tapped for activity:', data.activity_id);
      }
    });
    return () => sub.remove();
  }, []);

  if (loading || !dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6366F1', fontSize: 24, fontWeight: '800', marginBottom: 20 }}>DayFlow</Text>
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0F172A' }, headerTintColor: '#F1F5F9', headerShadowVisible: false }}>
        {!user ? (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create Account' }} />
          </>
        ) : onboarded === false ? (
          <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
            {() => <OnboardingScreen onComplete={() => setOnboarded(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen
              name="ActivityForm"
              component={ActivityFormScreen}
              options={({ route }) => ({
                title: (route.params as { activityId?: string })?.activityId ? 'Edit Activity' : 'New Activity',
              })}
            />
            <Stack.Screen
              name="ActivityDetail"
              component={ActivityDetailScreen}
              options={{ title: 'Activity' }}
            />
            <Stack.Screen
              name="LogForm"
              component={LogFormScreen}
              options={{ title: 'Log Experience' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
