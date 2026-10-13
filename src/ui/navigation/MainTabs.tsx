import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppTabBar } from './AppTabBar';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function HomeRoute() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <HomeScreen
      onNavigateToPrevention={() => nav.navigate('Prevention')}
      onNavigateToDuring={() => nav.navigate('During')}
      onNavigateToAfter={() => nav.navigate('After')}
      onNavigateToEmergency={() => nav.navigate('Emergency')}
      onNavigateToRescuer={() => nav.navigate('Rescuer')}
      onNavigateToPermissions={() => nav.navigate('Permissions')}
      onNavigateToDev={() => nav.navigate('Dev')}
      onNavigateToAlerts={() => nav.navigate('Main', { screen: 'Alerts' })}
      onNavigateToProfile={() => nav.navigate('Main', { screen: 'Profile' })}
    />
  );
}


export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeRoute} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Mapa' }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alertas' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
