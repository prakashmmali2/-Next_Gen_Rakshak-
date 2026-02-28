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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { PatientStackParamList } from '../../types';
import { Input, Button, Card } from '../../components';
import { addMedicine } from '../../services/medicineService';
import { useAuth } from '../../context/AuthContext';

type AddMedicineScreenProps = {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'AddMedicine'>;
};

const frequencies = [
  { key: 'once', label: 'Once a day', times: 1 },
  { key: 'twice', label: 'Twice a day', times: 2 },
  { key: 'three', label: 'Three times a day', times: 3 },
  { key: 'four', label: 'Four times a day', times: 4 },
  { key: 'as_needed', label: 'As needed', times: 0 },
];

const commonTimes = [
  '08:00', '09:00', '10:00', '12:00', 
  '14:00', '18:00', '20:00', '22:00'
];

export const AddMedicineScreen: React.FC<AddMedicineScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState(frequencies[0]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['08:00']);
  const [stock, setStock] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; dosage?: string; stock?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { name?: string; dosage?: string; stock?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Medicine name is required';
    }

    if (!dosage.trim()) {
      newErrors.dosage = 'Dosage is required';
    }

    if (!stock.trim()) {
      newErrors.stock = 'Stock quantity is required';
    } else if (parseInt(stock) < 0) {
      newErrors.stock = 'Stock must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMedicine = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      await addMedicine(
        user.id,
        name.trim(),
        dosage.trim(),
        frequency.label,
        selectedTimes,
        parseInt(stock),
        instructions.trim()
      );
      
      Alert.alert('Success', 'Medicine added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time].sort());
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
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Medicine</Text>
            <View style={{ width: 24 }} />
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Medicine Name"
              placeholder="Enter medicine name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />

            <Input
              label="Dosage"
              placeholder="e.g., 500mg, 2 tablets"
              value={dosage}
              onChangeText={setDosage}
              error={errors.dosage}
            />

            <View style={styles.frequencyContainer}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencyOptions}>
                {frequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.key}
                    style={[
                      styles.frequencyOption,
                      frequency.key === freq.key && styles.frequencyOptionSelected,
                    ]}
                    onPress={() => {
                      setFrequency(freq);
                      if (freq.times > 0 && selectedTimes.length === 0) {
                        const defaultTimes = commonTimes.slice(0, freq.times);
                        setSelectedTimes(defaultTimes);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        frequency.key === freq.key && styles.frequencyTextSelected,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {frequency.key !== 'as_needed' && (
              <View style={styles.timesContainer}>
                <Text style={styles.label}>Select Times</Text>
                <View style={styles.timesGrid}>
                  {commonTimes.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeChip,
                        selectedTimes.includes(time) && styles.timeChipSelected,
                      ]}
                      onPress={() => toggleTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selectedTimes.includes(time) && styles.timeTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedTimes.length === 0 && (
                  <Text style={styles.errorText}>Please select at least one time</Text>
                )}
              </View>
            )}

            <Input
              label="Stock Quantity"
              placeholder="Enter number of units"
              value={stock}
              onChangeText={setStock}
              error={errors.stock}
              keyboardType="numeric"
            />

            <Input
              label="Instructions (Optional)"
              placeholder="e.g., Take with food"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Add Medicine"
              onPress={handleAddMedicine}
              loading={loading}
              style={styles.addButton}
            />
          </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  frequencyContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  frequencyOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  frequencyOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  frequencyText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  frequencyTextSelected: {
    color: colors.white,
  },
  timesContainer: {
    marginBottom: spacing.md,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  timeTextSelected: {
    color: colors.white,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  addButton: {
    marginTop: spacing.md,
  },
});
