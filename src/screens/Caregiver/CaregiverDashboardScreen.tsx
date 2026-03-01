import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../utils/theme';
import { CaregiverStackParamList, Medicine, AdherenceStat, User } from '../../types';
import { Card, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getMedicinesByPatient, calculateAdherenceRate, getWeeklyAdherence } from '../../services/medicineService';
import { getLinkedPatient } from '../../services/authService';
import { getCaregiverAlerts, Alert } from '../../services/alertService';

type CaregiverDashboardScreenProps = {
  navigation: NativeStackNavigationProp<CaregiverStackParamList, 'CaregiverDashboard'>;
};

const screenWidth = Dimensions.get('window').width;

export const CaregiverDashboardScreen: React.FC<CaregiverDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<User | null>(null);
const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [adherenceRate, setAdherenceRate] = useState(100);
  const [weeklyStats, setWeeklyStats] = useState<AdherenceStat[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowAdherence, setLowAdherence] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      const linkedPatient = await getLinkedPatient(user.id, user.role);
      if (linkedPatient) {
        setPatient(linkedPatient);
const [meds, rate, weekly, caregiverAlerts] = await Promise.all([
          getMedicinesByPatient(linkedPatient.id),
          calculateAdherenceRate(linkedPatient.id),
          getWeeklyAdherence(linkedPatient.id),
          getCaregiverAlerts(linkedPatient.id),
        ]);
        setMedicines(meds);
        setAdherenceRate(rate);
        setWeeklyStats(weekly);
        setAlerts(caregiverAlerts.alerts);
        setMissedCount(caregiverAlerts.missedCount);
        setLowStockCount(caregiverAlerts.lowStockCount);
        setLowAdherence(caregiverAlerts.lowAdherence);
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

  const getAdherenceColor = () => {
    if (adherenceRate >= 80) return colors.success;
    if (adherenceRate >= 60) return colors.warning;
    return colors.error;
  };

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
        <View style={styles.noPatientContainer}>
          <Ionicons name="person-add" size={64} color={colors.textLight} />
          <Text style={styles.noPatientTitle}>No Patient Linked</Text>
          <Text style={styles.noPatientText}>
            Ask the patient to share their unique code to monitor their medication adherence.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome</Text>
            <Text style={styles.caregiverName}>{user?.name}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.patientCard}>
          <View style={styles.patientInfo}>
            <View style={styles.patientAvatar}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientRelation}>{user?.relation}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.adherenceCard}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.adherenceTitle}>Today's Adherence</Text>
            <View style={[styles.adherenceBadge, { backgroundColor: getAdherenceColor() }]}>
              <Text style={styles.adherenceRate}>{adherenceRate}%</Text>
            </View>
          </View>
          <Text style={styles.adherenceSubtitle}>
            {adherenceRate >= 80 ? 'Patient is doing great!' : 'Check on the patient'}
          </Text>
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Adherence</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={180}
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: colors.white,
              backgroundGradientTo: colors.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
              labelColor: () => colors.textSecondary,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card>

        <View style={styles.quickActions}>
          <Button
            title="Medicines"
            onPress={() => navigation.navigate('PatientMedicines', { patientId: patient.id })}
            style={styles.actionButton}
          />
          <Button
            title="Adherence"
            onPress={() => navigation.navigate('CaregiverAdherence', { patientId: patient.id })}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

<Card style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Alerts</Text>
          
          {/* Low Adherence Alert */}
          {lowAdherence ? (
            <View style={[styles.alertItem, styles.criticalAlertItem]}>
              <Ionicons name="warning" size={20} color={colors.error} />
              <Text style={[styles.alertText, styles.criticalAlertText]}>
                Low adherence: {adherenceRate}% (below 60%)
              </Text>
            </View>
          ) : (
            <View style={styles.alertItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.alertText}>Adherence is good</Text>
            </View>
          )}
          
          {/* Missed 3 Times Alert */}
          {missedCount > 0 ? (
            <View style={[styles.alertItem, styles.criticalAlertItem]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.alertText, styles.criticalAlertText]}>
                {missedCount} medicine(s) missed 3+ times
              </Text>
            </View>
          ) : null}
          
          {/* Low Stock Alert */}
          {lowStockCount > 0 ? (
            <View style={[styles.alertItem, styles.warningAlertItem]}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={[styles.alertText, styles.warningAlertText]}>
                {lowStockCount} medicine(s) with low stock
              </Text>
            </View>
          ) : (
            <View style={styles.alertItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.alertText}>All medicines are well stocked</Text>
            </View>
          )}
          
{/* Show count of total alerts */}
          {alerts.length > 0 && (
            <View style={styles.viewAllButton}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.viewAllText}>
                Total: {alerts.length} alert(s) need attention
              </Text>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  caregiverName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  patientCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  patientName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  patientRelation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  noPatientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  noPatientTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  noPatientText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  adherenceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adherenceTitle: {
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
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  adherenceSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  alertsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  alertsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  criticalAlertItem: {
    backgroundColor: colors.error + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  criticalAlertText: {
    color: colors.error,
    fontWeight: '600',
  },
  warningAlertItem: {
    backgroundColor: colors.warning + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  warningAlertText: {
    color: colors.warning,
    fontWeight: '600',
  },
  alertText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewAllText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
