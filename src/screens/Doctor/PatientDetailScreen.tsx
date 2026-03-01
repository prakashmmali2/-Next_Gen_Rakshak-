import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { DoctorStackParamList, User, Medicine, AdherenceStat, AdherenceDetails } from '../../types';
import { Card, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../services/authService';
import { getMedicinesByPatient, getWeeklyAdherence, calculateAdherenceDetails, calculateWeeklyAdherence } from '../../services/medicineService';

type PatientDetailScreenProps = {
  navigation: NativeStackNavigationProp<DoctorStackParamList, 'PatientDetail'>;
  route: RouteProp<DoctorStackParamList, 'PatientDetail'>;
};

const screenWidth = Dimensions.get('window').width;

export const PatientDetailScreen: React.FC<PatientDetailScreenProps> = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { user } = useAuth();
  const [patient, setPatient] = useState<User | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<AdherenceStat[]>([]);
  const [adherenceDetails, setAdherenceDetails] = useState<AdherenceDetails | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatientData = async () => {
    try {
      // Load patient info
      const patientData = await getUserById(patientId);
      if (patientData) {
        setPatient(patientData);
        
        // Load medicines (view-only for doctor)
        const medicinesData = await getMedicinesByPatient(patientId);
        setMedicines(medicinesData);
        
        // Load weekly adherence
        const weekly = await getWeeklyAdherence(patientId);
        setWeeklyStats(weekly);
        
        // Load detailed adherence
        const details = await calculateAdherenceDetails(patientId);
        setAdherenceDetails(details);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
    }, [patientId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return colors.success;
    if (rate >= 60) return colors.warning;
    return colors.error;
  };

  const currentAdherence = adherenceDetails?.weeklyAdherence || weeklyStats.length > 0 
    ? weeklyStats[weeklyStats.length - 1]?.adherenceRate || 0 
    : 0;

  const chartData = {
    labels: weeklyStats.length > 0 
      ? weeklyStats.map(s => s.date.slice(-2))
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: weeklyStats.length > 0
          ? weeklyStats.map(s => s.adherenceRate || 0)
          : [100, 100, 100, 100, 100, 100, 100],
      },
    ],
  };

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading patient data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Patient Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DoctorAlerts')}>
          <Ionicons name="notifications" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Patient Info Card */}
        <Card style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <Ionicons name="person" size={32} color={colors.secondary} />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientAge}>{patient.age || 'N/A'} years old</Text>
              <Text style={styles.patientCode}>Code: {patient.uniqueCode}</Text>
            </View>
          </View>
        </Card>

        {/* Adherence Overview */}
        <Card style={styles.adherenceCard}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.sectionTitle}>Adherence Overview</Text>
            <View style={[styles.adherenceBadge, { backgroundColor: getAdherenceColor(currentAdherence) }]}>
              <Text style={styles.adherenceRate}>{currentAdherence}%</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{adherenceDetails?.totalDoses || 0}</Text>
              <Text style={styles.statLabel}>Total Doses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.success }]}>{adherenceDetails?.takenDoses || 0}</Text>
              <Text style={styles.statLabel}>Taken</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.error }]}>{adherenceDetails?.missedDoses || 0}</Text>
              <Text style={styles.statLabel}>Missed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>{adherenceDetails?.skippedDoses || 0}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
          </View>
        </Card>

        {/* Weekly Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Weekly Adherence</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={180}
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: colors.white,
              backgroundGradientTo: colors.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
              labelColor: () => colors.textSecondary,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.secondary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card>

        {/* Medicines (View Only) */}
        <Card style={styles.medicinesCard}>
          <View style={styles.medicinesHeader}>
            <Text style={styles.sectionTitle}>Current Medicines</Text>
            <Text style={styles.readOnlyNote}>(View Only)</Text>
          </View>
          
          {medicines.length === 0 ? (
            <Text style={styles.noMedicinesText}>No medicines assigned</Text>
          ) : (
            medicines.map((medicine) => (
              <View key={medicine.id} style={styles.medicineItem}>
                <View style={styles.medicineIcon}>
                  <Ionicons name="medical" size={20} color={colors.secondary} />
                </View>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineDosage}>{medicine.dosage} - {medicine.frequency}</Text>
                  <Text style={styles.medicineStock}>Stock: {medicine.stock} doses</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Adherence Insights */}
        {adherenceDetails && (
          <Card style={styles.insightsCard}>
            <Text style={styles.sectionTitle}>Adherence Insights</Text>
            
            <View style={styles.insightItem}>
              <Ionicons name="time" size={20} color={colors.secondary} />
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>Average Delay</Text>
                <Text style={styles.insightValue}>
                  {adherenceDetails.averageDelayTime > 0 
                    ? `${adherenceDetails.averageDelayTime} minutes` 
                    : 'No delays recorded'}
                </Text>
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <Ionicons name="alert-circle" size={20} color={colors.secondary} />
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>Most Missed Time</Text>
                <Text style={styles.insightValue}>{adherenceDetails.mostMissedTimePeriod}</Text>
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <Ionicons name="warning" size={20} color={colors.secondary} />
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>Skip Rate</Text>
                <Text style={styles.insightValue}>{adherenceDetails.skipRate}%</Text>
              </View>
            </View>
          </Card>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  patientAge: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  patientCode: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginTop: 2,
  },
  adherenceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  adherenceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  adherenceRate: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  chart: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  medicinesCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  medicinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  readOnlyNote: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  noMedicinesText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  medicineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  medicineDosage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  medicineStock: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  insightsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  insightContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  insightLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  insightValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
