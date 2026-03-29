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
import { PlanScreen } from '../features/plan/screens/PlanScreen';
import { SettingsScreen } from '../features/canvas/screens/SettingsScreen';
import { SearchScreen } from '../features/search/screens/SearchScreen';
import { BacklogScreen } from '../features/backlog/screens/BacklogScreen';
import { CategoryListScreen } from '../features/categories/screens/CategoryListScreen';
import { InsightsScreen } from '../features/insights/screens/InsightsScreen';
import { GoalFormScreen } from '../features/goals/screens/GoalFormScreen';
import { GoalEditScreen } from '../features/goals/screens/GoalEditScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: () => null,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0EAE0',
          borderTopWidth: 0.5,
          height: 52,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#2D4A3E',
        tabBarInactiveTintColor: '#C4BFB8',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
      })}
    >
      <Tab.Screen name="Today" component={CanvasScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
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
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#2D4A3E', fontSize: 28, fontWeight: '600', marginBottom: 20 }}>DayFlow</Text>
        <ActivityIndicator color="#2D4A3E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#FAF7F2' }, headerTintColor: '#1A1A1A', headerShadowVisible: false }}>
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
              options={{
                presentation: 'transparentModal',
                headerShown: false,
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="GoalForm"
              component={GoalFormScreen}
              options={{
                presentation: 'transparentModal',
                headerShown: false,
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="GoalEdit"
              component={GoalEditScreen as any}
              options={{
                presentation: 'transparentModal',
                headerShown: false,
                animation: 'slide_from_bottom',
              }}
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
            <Stack.Screen
              name="CategoryList"
              component={CategoryListScreen}
              options={{ title: 'Categories' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
