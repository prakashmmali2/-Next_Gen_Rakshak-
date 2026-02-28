import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { PatientStackParamList, Medicine } from '../../types';
import { Card, MedicineCard, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getMedicinesByPatient, deleteMedicine } from '../../services/medicineService';

type PatientMedicinesScreenProps = {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'PatientMedicines'>;
};

export const PatientMedicinesScreen: React.FC<PatientMedicinesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low_stock'>('all');

  const loadMedicines = async () => {
    if (!user) return;

    try {
      const meds = await getMedicinesByPatient(user.id);
      setMedicines(meds);
    } catch (error) {
      console.error('Error loading medicines:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicines();
    setRefreshing(false);
  };

  const handleDeleteMedicine = (medicine: Medicine) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to delete "${medicine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicine(medicine.id);
              loadMedicines();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete medicine');
            }
          },
        },
      ]
    );
  };

  const filteredMedicines = medicines.filter((med) => {
    if (filter === 'low_stock') {
      return med.stock <= 5;
    }
    return true;
  });

  const renderMedicineItem = ({ item }: { item: Medicine }) => (
    <MedicineCard
      medicine={item}
      onPress={() => navigation.navigate('MedicineDetail', { medicineId: item.id })}
    />
  );

  const renderEmptyList = () => (
    <Card style={styles.emptyCard}>
      <Ionicons name="medical-outline" size={64} color={colors.textLight} />
      <Text style={styles.emptyTitle}>No Medicines Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start by adding your medicines to track them
      </Text>
      <Button
        title="Add Medicine"
        onPress={() => navigation.navigate('AddMedicine')}
        style={styles.addButton}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Medicines</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddMedicine')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({medicines.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'low_stock' && styles.filterButtonActive]}
          onPress={() => setFilter('low_stock')}
        >
          <Text style={[styles.filterText, filter === 'low_stock' && styles.filterTextActive]}>
            Low Stock ({medicines.filter(m => m.stock <= 5).length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredMedicines}
        renderItem={renderMedicineItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  addButton: {
    paddingHorizontal: spacing.xl,
  },
});
