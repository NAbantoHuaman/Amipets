import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RequestsScreen } from '../screens/RequestsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, fonts } from '../theme';
import { IconName } from '../utils/requestMeta';
import { useRequests } from '../context/RequestsContext';
import { activeUrgent } from '../utils/requests';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, { active: IconName; inactive: IconName; label: string }> = {
  Home: { active: 'home', inactive: 'home-outline', label: 'Inicio' },
  Requests: { active: 'clipboard', inactive: 'clipboard-outline', label: 'Solicitudes' },
  Calendar: { active: 'calendar', inactive: 'calendar-outline', label: 'Calendario' },
  Settings: { active: 'settings', inactive: 'settings-outline', label: 'Ajustes' },
};

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const { requests } = useRequests();
  const urgentCount = activeUrgent(requests).length;

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 12);
  const barHeight = 64 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarShowLabel: true,
        tabBarLabel: ICONS[route.name].label,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.bar,
          {
            height: barHeight,
            paddingBottom: bottomInset,
          },
        ],
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color }) => (
          <Ionicons
            name={focused ? ICONS[route.name].active : ICONS[route.name].inactive}
            size={24}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarBadge: urgentCount > 0 ? urgentCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    ...Platform.select({
      android: { elevation: 4 },
      default: { shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: -2 } },
    }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 15,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  badge: {
    backgroundColor: colors.danger,
    fontFamily: fonts.bold,
    fontSize: 10,
    minWidth: 18,
    height: 18,
    lineHeight: 16,
  },
});
