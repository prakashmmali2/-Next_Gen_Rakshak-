import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize } from '../../utils/theme';
import { AuthStackParamList, User } from '../../types';
import { Input, Button, Card } from '../../components';
import { createPatient } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

type PatientRegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'PatientRegister'>;
};

export const PatientRegisterScreen: React.FC<PatientRegisterScreenProps> = ({ navigation }) => {
  const { login, setFirstLaunchComplete } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; age?: string; username?: string }>({});
  const [registeredUser, setRegisteredUser] = useState<{ user: User; uniqueCode: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; age?: string; username?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        newErrors.age = 'Please enter a valid age';
      }
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await createPatient(name.trim(), parseInt(age), username.trim());
      setRegisteredUser(result);
      await login(result.user);
      await setFirstLaunchComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (registeredUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Card style={styles.successCard}>
            <View style={styles.successIcon}>
              <Text style={styles.successEmoji}>🎉</Text>
            </View>
            <Text style={styles.successTitle}>Registration Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your unique patient code is:
            </Text>
            <View style={styles.codeContainer}>
              <Text style={styles.uniqueCode}>{registeredUser.uniqueCode}</Text>
            </View>
            <Text style={styles.codeInstructions}>
              Share this code with your caregiver or doctor to let them monitor your health.
            </Text>
            <Button
              title="Continue to App"
              onPress={() => navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })}
              style={styles.continueButton}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Patient Registration</Text>
            <Text style={styles.subtitle}>
              Enter your details to get started
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />

            <Input
              label="Age"
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              error={errors.age}
              keyboardType="numeric"
            />

            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoCapitalize="none"
            />

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />
          </Card>

          <Button
            title="Back to Role Selection"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.backButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  successCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.lg,
    borderRadius: 12,
    marginVertical: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  uniqueCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 4,
  },
  codeInstructions: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  continueButton: {
    width: '100%',
  },
});
