import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { colors, spacing, fontSize } from '../utils/theme';
import { Medicine } from '../types';

interface MedicineCardProps {
  medicine: Medicine;
  onPress: () => void;
  onTakeMedicine?: () => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onPress,
  onTakeMedicine,
}) => {
  const getStockColor = () => {
    if (medicine.stock === 0) return colors.error;
    if (medicine.stock <= 5) return colors.warning;
    return colors.success;
  };

  const getStockText = () => {
    if (medicine.stock === 0) return 'Out of Stock';
    if (medicine.stock <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const times = JSON.parse(medicine.times) as string[];

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="medical" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.dosage}>{medicine.dosage}</Text>
        </View>
        <View style={[styles.stockBadge, { backgroundColor: getStockColor() }]}>
          <Text style={styles.stockText}>{getStockText()}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {medicine.frequency} • {times.join(', ')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>Stock: {medicine.stock} units</Text>
        </View>
      </View>

      {medicine.instructions && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsText} numberOfLines={2}>
            {medicine.instructions}
          </Text>
        </View>
      )}

      {onTakeMedicine && (
        <TouchableOpacity style={styles.takeButton} onPress={onTakeMedicine}>
          <Ionicons name="checkmark-circle" size={20} color={colors.white} />
          <Text style={styles.takeButtonText}>Take Now</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  medicineName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dosage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  stockText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
  details: {
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  instructions: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  takeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  takeButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
