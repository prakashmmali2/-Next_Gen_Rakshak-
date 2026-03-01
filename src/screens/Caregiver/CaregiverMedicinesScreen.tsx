import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { CaregiverStackParamList, Medicine } from '../../types';
import { Card, MedicineCard } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getMedicinesByPatient } from '../../services/medicineService';
import { getLinkedPatient } from '../../services/authService';

type CaregiverMedicinesScreenProps = {
  navigation: NativeStackNavigationProp<CaregiverStackParamList, 'PatientMedicines'>;
};

export const CaregiverMedicinesScreen: React.FC<CaregiverMedicinesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low_stock'>('all');

  const loadData = async () => {
    if (!user) return;

    try {
      const linkedPatient = await getLinkedPatient(user.id, user.role);
      if (linkedPatient) {
        setPatient(linkedPatient);
        const meds = await getMedicinesByPatient(linkedPatient.id);
        setMedicines(meds);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      onPress={() => {}}
    />
  );

  const renderEmptyList = () => (
    <Card style={styles.emptyCard}>
      <Ionicons name="medical-outline" size={64} color={colors.textLight} />
      <Text style={styles.emptyTitle}>No Medicines</Text>
      <Text style={styles.emptySubtitle}>
        The patient hasn't added any medicines yet
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {patient ? `${patient.name}'s Medicines` : 'Medicines'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoContainer}>
        <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          View-only - You cannot edit medicines
        </Text>
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  },
});
