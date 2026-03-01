import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
// NavigationContainer provides the routing configuration
import { NavigationContainer } from '@react-navigation/native';
// createNativeStackNavigator creates native stack navigators
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { initDatabase } from './src/database/database';
import { colors } from './src/utils/theme';

// Auth Screens
import {
  RoleSelectionScreen,
  PatientRegisterScreen,
  CaregiverRegisterScreen,
  DoctorRegisterScreen,
  LoginScreen,
} from './src/screens/Auth';

// Patient Screens
import {
  PatientHomeScreen,
  AddMedicineScreen,
  PatientMedicinesScreen,
  PatientProfileScreen,
  PatientAdherenceScreen,
  MedicineDetailScreen,
  FaceScanScreen,
} from './src/screens/Patient';

// Caregiver Screens
import { CaregiverDashboardScreen, CaregiverMedicinesScreen, CaregiverAdherenceScreen } from './src/screens/Caregiver';

// Doctor Screens
import { DoctorDashboardScreen, PatientListScreen, PatientDetailScreen, DoctorAlertsScreen, AppointmentsScreen } from './src/screens/Doctor';

// Types
import {
  AuthStackParamList,
  PatientStackParamList,
  CaregiverStackParamList,
  DoctorStackParamList,
  RootTabParamList,
} from './src/types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const PatientStack = createNativeStackNavigator<PatientStackParamList>();
const CaregiverStack = createNativeStackNavigator<CaregiverStackParamList>();
const DoctorStack = createNativeStackNavigator<DoctorStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <AuthStack.Screen name="PatientRegister" component={PatientRegisterScreen} />
      <AuthStack.Screen name="CaregiverRegister" component={CaregiverRegisterScreen} />
      <AuthStack.Screen name="DoctorRegister" component={DoctorRegisterScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

const PatientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MedicinesTab') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'AdherenceTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={PatientHomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="MedicinesTab" 
        component={PatientMedicinesScreen}
        options={{ tabBarLabel: 'Medicines' }}
      />
      <Tab.Screen 
        name="AdherenceTab" 
        component={PatientAdherenceScreen}
        options={{ tabBarLabel: 'Adherence' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={PatientProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const PatientNavigator = () => {
  return (
    <PatientStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <PatientStack.Screen name="PatientHome" component={PatientTabNavigator} />
      <PatientStack.Screen name="AddMedicine" component={AddMedicineScreen} />
      <PatientStack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
      <PatientStack.Screen name="FaceScan" component={FaceScanScreen} />
    </PatientStack.Navigator>
  );
};

const CaregiverNavigator = () => {
  return (
    <CaregiverStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <CaregiverStack.Screen name="CaregiverDashboard" component={CaregiverDashboardScreen} />
      <CaregiverStack.Screen name="PatientMedicines" component={CaregiverMedicinesScreen} />
      <CaregiverStack.Screen name="CaregiverAdherence" component={CaregiverAdherenceScreen} />
    </CaregiverStack.Navigator>
  );
};

const DoctorNavigator = () => {
  return (
    <DoctorStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <DoctorStack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
      <DoctorStack.Screen name="PatientList" component={PatientListScreen} />
      <DoctorStack.Screen name="PatientDetail" component={PatientDetailScreen} />
      <DoctorStack.Screen name="PatientAdherenceReport" component={PatientAdherenceScreen} />
      <DoctorStack.Screen name="DoctorAlerts" component={DoctorAlertsScreen} />
      <DoctorStack.Screen name="Appointments" component={AppointmentsScreen} />
    </DoctorStack.Navigator>
  );
};

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Database initialization error:', error);
        setDbInitialized(true);
      }
    };
    init();
  }, []);

  if (isLoading || !dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {!user ? (
        <AuthNavigator />
      ) : (
        <>
          {user.role === 'patient' && <PatientNavigator />}
          {user.role === 'caregiver' && <CaregiverNavigator />}
          {user.role === 'doctor' && <DoctorNavigator />}
        </>
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
