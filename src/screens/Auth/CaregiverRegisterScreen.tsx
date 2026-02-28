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
import { createCaregiver } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

type CaregiverRegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'CaregiverRegister'>;
};

const relations = [
  'Father',
  'Mother',
  'Wife',
  'Husband',
  'Brother',
  'Sister',
  'Son',
  'Daughter',
  'Other',
];

export const CaregiverRegisterScreen: React.FC<CaregiverRegisterScreenProps> = ({ navigation }) => {
  const { login, setFirstLaunchComplete } = useAuth();
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; relation?: string; patientCode?: string }>({});
  const [showRelationPicker, setShowRelationPicker] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; relation?: string; patientCode?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!relation) {
      newErrors.relation = 'Please select a relation';
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
      const result = await createCaregiver(name.trim(), relation, patientCode.trim().toUpperCase());
      
      if (result.success && result.user) {
        await login(result.user);
        await setFirstLaunchComplete();
      } else {
        Alert.alert('Error', result.error || 'Failed to register caregiver.');
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
            <Text style={styles.title}>Caregiver Registration</Text>
            <Text style={styles.subtitle}>
              Enter your details to connect with a patient
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Your Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />

            <View style={styles.relationContainer}>
              <Text style={styles.label}>Relation to Patient</Text>
              <TouchableOpacity
                style={[styles.relationPicker, errors.relation && styles.relationPickerError]}
                onPress={() => setShowRelationPicker(!showRelationPicker)}
              >
                <Text style={[styles.relationText, !relation && styles.placeholderText]}>
                  {relation || 'Select relation'}
                </Text>
              </TouchableOpacity>
              {errors.relation && <Text style={styles.errorText}>{errors.relation}</Text>}
              
              {showRelationPicker && (
                <View style={styles.relationOptions}>
                  {relations.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.relationOption, relation === r && styles.relationOptionSelected]}
                      onPress={() => {
                        setRelation(r);
                        setShowRelationPicker(false);
                      }}
                    >
                      <Text style={[styles.relationOptionText, relation === r && styles.relationOptionTextSelected]}>
                        {r}
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
  relationContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  relationPicker: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  relationPickerError: {
    borderColor: colors.error,
  },
  relationText: {
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
  relationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  relationOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  relationOptionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  relationOptionTextSelected: {
    color: colors.white,
  },
});
