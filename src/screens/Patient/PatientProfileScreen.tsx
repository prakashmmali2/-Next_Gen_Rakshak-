import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../utils/theme';
import { PatientStackParamList } from '../../types';
import { Card, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';

type PatientProfileScreenProps = {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'PatientProfile'>;
};

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleCopyCode = async () => {
    if (user?.uniqueCode) {
      try {
        await Share.share({
          message: `My OwnMediCare Patient Code: ${user.uniqueCode}`,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to copy code');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Personal Information',
      subtitle: 'Update your profile details',
      onPress: () => {},
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage reminders and alerts',
      onPress: () => {},
    },
    {
      icon: 'time-outline',
      title: 'Reminder Settings',
      subtitle: 'Customize medicine reminders',
      onPress: () => {},
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy & Security',
      subtitle: 'Manage your data',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get assistance',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userAge}>{user?.age} years old</Text>
          </View>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Your Patient Code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{user?.uniqueCode}</Text>
              <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
                <Ionicons name="share-social" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.codeHint}>
              Share this code with your caregiver or doctor
            </Text>
          </View>
        </Card>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userAge: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  codeContainer: {
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  codeText: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 2,
  },
  copyButton: {
    padding: spacing.sm,
  },
  codeHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});
