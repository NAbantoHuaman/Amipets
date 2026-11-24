import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { PawBackdrop } from '../components';
import { BreedGuideScreen } from '../screens/BreedGuideScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CreateOrderScreen } from '../screens/CreateOrderScreen';
import { CreateRequestScreen } from '../screens/CreateRequestScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RequestDetailScreen } from '../screens/RequestDetailScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { colors } from '../theme';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export function RootNavigator() {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loadingScreen}>
        <PawBackdrop variant="auth" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="BreedGuide" component={BreedGuideScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
            <Stack.Screen
              name="CreateRequest"
              component={CreateRequestScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen
              name="CreateOrder"
              component={CreateOrderScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
