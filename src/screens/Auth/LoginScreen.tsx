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
import { AuthStackParamList } from '../../types';
import { Input, Button, Card } from '../../components';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; uniqueCode?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { username?: string; uniqueCode?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!uniqueCode.trim()) {
      newErrors.uniqueCode = 'Unique code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await loginUser(username.trim(), uniqueCode.trim().toUpperCase());
      
      if (user) {
        await login(user);
      } else {
        Alert.alert('Login Failed', 'Invalid username or unique code.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Login to continue to OwnMediCare
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Username or Unique Code"
              placeholder="Enter username or unique code"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoCapitalize="none"
            />

            <Input
              label="Unique Code"
              placeholder="Enter your unique code"
              value={uniqueCode}
              onChangeText={(text) => setUniqueCode(text.toUpperCase())}
              error={errors.uniqueCode}
              autoCapitalize="characters"
              secureTextEntry
            />

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
          </Card>

          <Button
            title="Create New Account"
            onPress={() => navigation.navigate('RoleSelection')}
            variant="outline"
            style={styles.registerButton}
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.header,
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
  loginButton: {
    marginTop: spacing.md,
  },
  registerButton: {
    marginTop: spacing.md,
  },
});
