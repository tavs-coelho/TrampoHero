import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { JobsListScreen } from '../screens/jobs/JobsListScreen';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Jobs: undefined;
  Map: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  JobDetail: { jobId: string };
  Chat: { jobId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a1a2e',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={JobsListScreen}
        options={{ title: 'Vagas' }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Mapa' }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ title: 'Detalhes da Vaga' }}
      />
      <RootStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </RootStack.Navigator>
  );
}

export function AppNavigator() {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a1a2e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppStackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
