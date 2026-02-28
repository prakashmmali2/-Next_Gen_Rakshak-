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
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { AuthStackParamList } from '../../types';
import { Input, Button, Card } from '../../components';
import { createDoctor } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

type DoctorRegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'DoctorRegister'>;
};

const specializations = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'Neurologist',
  'Oncologist',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Rheumatologist',
  'Urologist',
  'Other',
];

export const DoctorRegisterScreen: React.FC<DoctorRegisterScreenProps> = ({ navigation }) => {
  const { login, setFirstLaunchComplete } = useAuth();
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; specialization?: string; patientCode?: string }>({});
  const [showSpecializationPicker, setShowSpecializationPicker] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; specialization?: string; patientCode?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!specialization) {
      newErrors.specialization = 'Please select a specialization';
    }

    if (!patientCode.trim()) {
      newErrors.patientCode = 'Patient code is required';
    } else if (!patientCode.startsWith('OM') || patientCode.length !== 8) {
      newErrors.patientCode = 'Invalid patient code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await createDoctor(name.trim(), specialization, patientCode.trim().toUpperCase());
      
      if (result.success && result.user) {
        await login(result.user);
        await setFirstLaunchComplete();
      } else {
        Alert.alert('Error', result.error || 'Failed to register doctor.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to register. Please try again.');
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
            <Text style={styles.title}>Doctor Registration</Text>
            <Text style={styles.subtitle}>
              Enter your details to connect with a patient
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Doctor Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />

            <View style={styles.specializationContainer}>
              <Text style={styles.label}>Specialization</Text>
              <TouchableOpacity
                style={[styles.specializationPicker, errors.specialization && styles.specializationPickerError]}
                onPress={() => setShowSpecializationPicker(!showSpecializationPicker)}
              >
                <Text style={[styles.specializationText, !specialization && styles.placeholderText]}>
                  {specialization || 'Select specialization'}
                </Text>
              </TouchableOpacity>
              {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}
              
              {showSpecializationPicker && (
                <View style={styles.specializationOptions}>
                  {specializations.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.specializationOption, specialization === s && styles.specializationOptionSelected]}
                      onPress={() => {
                        setSpecialization(s);
                        setShowSpecializationPicker(false);
                      }}
                    >
                      <Text style={[styles.specializationOptionText, specialization === s && styles.specializationOptionTextSelected]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Input
              label="Patient's Unique Code"
              placeholder="Enter patient code (e.g., OM4F7K9Q)"
              value={patientCode}
              onChangeText={(text) => setPatientCode(text.toUpperCase())}
              error={errors.patientCode}
              autoCapitalize="characters"
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
  specializationContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  specializationPicker: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  specializationPickerError: {
    borderColor: colors.error,
  },
  specializationText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textLight,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  specializationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  specializationOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specializationOptionSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  specializationOptionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  specializationOptionTextSelected: {
    color: colors.white,
  },
});
