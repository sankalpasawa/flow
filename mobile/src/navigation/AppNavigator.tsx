import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { seedSystemCategories } from '../lib/db/categories';
import { seedDummyData } from '../lib/db/seed';
import { requestNotificationPermission, addNotificationResponseListener } from '../lib/notifications';
import {
  hasCompletedOnboarding, markOnboardingComplete, OnboardingScreen,
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
import { SearchScreen } from '../features/search/screens/SearchScreen';
import { BacklogScreen } from '../features/backlog/screens/BacklogScreen';
import { CategoryListScreen } from '../features/categories/screens/CategoryListScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Canvas: '📅', Someday: '📋', Categories: '🏷️', Logs: '📓', Settings: '⚙️',
  };
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
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Canvas" component={CanvasScreen} />
      <Tab.Screen name="Someday" component={BacklogScreen} />
      <Tab.Screen name="Categories" component={CategoryListScreen} />
      <Tab.Screen name="Logs" component={LogHistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Check onboarding synchronously from localStorage on web (avoids AsyncStorage race)
function checkOnboardedSync(): boolean | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('dayflow_onboarded') === 'true') {
      return true;
    }
  } catch {}
  return null;
}

export function AppNavigator() {
  const { user, loading, initialize } = useAuthStore();
  const [onboarded, setOnboarded] = useState<boolean | null>(checkOnboardedSync);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Seed BEFORE initializing DB/auth so localStorage is populated
        // before the web DB singleton reads it
        await seedDummyData();
        await initialize();
        await seedSystemCategories();
        await markOnboardingComplete();
        // Set onboarded state directly here to avoid race with user-dependent effect
        setOnboarded(true);
      } catch (err) {
        console.error('[DayFlow] App initialization failed:', err);
      } finally {
        setDbReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      hasCompletedOnboarding().then(setOnboarded).catch((err) => {
        console.error('[DayFlow] Failed to check onboarding status:', err);
        setOnboarded(false);
      });
      requestNotificationPermission().catch((err) => {
        console.warn('[DayFlow] Notification permission request failed:', err);
      });
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
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
