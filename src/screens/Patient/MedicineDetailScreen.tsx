import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../utils/theme';
import { PatientStackParamList, Medicine, MedicineLog } from '../../types';
import { Card, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import {
  getMedicineById,
  getLogsByMedicine,
  markMedicineTaken,
  markMedicineMissed,
  markMedicineSkipped,
  updateMedicineStock,
} from '../../services/medicineService';

type MedicineDetailScreenProps = {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'MedicineDetail'>;
  route: RouteProp<PatientStackParamList, 'MedicineDetail'>;
};

export const MedicineDetailScreen: React.FC<MedicineDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { medicineId } = route.params;
  const { user } = useAuth();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [logs, setLogs] = useState<MedicineLog[]>([]);

  const loadData = async () => {
    try {
      const [med, medicineLogs] = await Promise.all([
        getMedicineById(medicineId),
        getLogsByMedicine(medicineId),
      ]);
      setMedicine(med);
      setLogs(medicineLogs);
    } catch (error) {
      console.error('Error loading medicine:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [medicineId])
  );

  const handleTakeMedicine = async (logId: number) => {
    try {
      await markMedicineTaken(logId);
      if (medicine && medicine.stock > 0) {
        await updateMedicineStock(medicineId, medicine.stock - 1);
      }
      loadData();
      Alert.alert('Success', 'Medicine marked as taken!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update medicine status');
    }
  };

  const handleSkipMedicine = async (logId: number) => {
    Alert.alert('Skip Medicine', 'Are you sure you want to skip this dose?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip',
        onPress: async () => {
          try {
            await markMedicineSkipped(logId, 'Skipped by user');
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to skip medicine');
          }
        },
      },
    ]);
  };

  const handleMissedMedicine = async (logId: number) => {
    try {
      await markMedicineMissed(logId);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as missed');
    }
  };

  if (!medicine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const times = JSON.parse(medicine.times || '[]');
  const isLowStock = medicine.stock <= 5;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Medicine Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.medicineHeader}>
            <View style={styles.medicineIcon}>
              <Ionicons name="medical" size={32} color={colors.primary} />
            </View>
            <View style={styles.medicineInfo}>
              <Text style={styles.medicineName}>{medicine.name}</Text>
              <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="repeat" size={20} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Frequency:</Text>
            <Text style={styles.detailValue}>{medicine.frequency}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Times:</Text>
            <Text style={styles.detailValue}>{times.join(', ')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cube" size={20} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Stock:</Text>
            <Text style={[styles.detailValue, isLowStock && styles.lowStock]}>
              {medicine.stock} units {isLowStock && '(Low)'}
            </Text>
          </View>

          {medicine.instructions && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsLabel}>Instructions:</Text>
              <Text style={styles.instructionsText}>{medicine.instructions}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              title="Take Now"
              onPress={() => {
                const pendingLog = logs.find(l => l.status === 'pending');
                if (pendingLog) {
                  handleTakeMedicine(pendingLog.id);
                } else {
                  Alert.alert('No Pending Dose', 'No pending dose to take right now');
                }
              }}
              style={styles.actionButton}
            />
            <Button
              title="Skip"
              variant="secondary"
              onPress={() => {
                const pendingLog = logs.find(l => l.status === 'pending');
                if (pendingLog) {
                  handleSkipMedicine(pendingLog.id);
                } else {
                  Alert.alert('No Pending Dose', 'No pending dose to skip');
                }
              }}
              style={styles.actionButton}
            />
          </View>
        </Card>

        <Card style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {logs.length === 0 ? (
            <Text style={styles.noLogs}>No activity recorded yet</Text>
          ) : (
            logs.slice(0, 10).map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View
                  style={[
                    styles.logIcon,
                    {
                      backgroundColor:
                        log.status === 'taken'
                          ? colors.success + '20'
                          : log.status === 'missed'
                          ? colors.error + '20'
                          : colors.warning + '20',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      log.status === 'taken'
                        ? 'checkmark'
                        : log.status === 'missed'
                        ? 'close'
                        : 'remove'
                    }
                    size={16}
                    color={
                      log.status === 'taken'
                        ? colors.success
                        : log.status === 'missed'
                        ? colors.error
                        : colors.warning
                    }
                  />
                </View>
                <View style={styles.logInfo}>
                  <Text style={styles.logStatus}>
                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                  </Text>
                  <Text style={styles.logTime}>
                    {new Date(log.scheduledTime).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  medicineIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  medicineDosage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lowStock: {
    color: colors.error,
  },
  instructionsContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.md,
  },
  instructionsLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  instructionsText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  actionCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  historyCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  noLogs: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logInfo: {
    flex: 1,
  },
  logStatus: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  logTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
