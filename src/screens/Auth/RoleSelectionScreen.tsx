import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { AuthStackParamList } from '../../types';

type RoleSelectionScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'RoleSelection'>;
};

interface RoleOption {
  key: 'patient' | 'caregiver' | 'doctor';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const roleOptions: RoleOption[] = [
  {
    key: 'patient',
    title: 'Patient',
    subtitle: 'Track your medications',
    icon: 'person',
    gradient: ['#2E7D32', '#4CAF50'],
  },
  {
    key: 'caregiver',
    title: 'Caregiver',
    subtitle: 'Monitor loved ones',
    icon: 'people',
    gradient: ['#1565C0', '#42A5F5'],
  },
  {
    key: 'doctor',
    title: 'Doctor',
    subtitle: 'Manage patients',
    icon: 'medkit',
    gradient: ['#FF6F00', '#FFA000'],
  },
];

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const handleRoleSelect = (role: 'patient' | 'caregiver' | 'doctor') => {
    switch (role) {
      case 'patient':
        navigation.navigate('PatientRegister');
        break;
      case 'caregiver':
        navigation.navigate('CaregiverRegister');
        break;
      case 'doctor':
        navigation.navigate('DoctorRegister');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="medical" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>OwnMediCare</Text>
        <Text style={styles.subtitle}>Your Personal Healthcare Companion</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Your Role</Text>
        
        {roleOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => handleRoleSelect(option.key)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={option.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.roleCard}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name={option.icon} size={32} color={colors.white} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>{option.title}</Text>
                <Text style={styles.roleSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          OwnMediCare helps you track medications and maintain better health.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.header,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.white,
  },
  roleSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
