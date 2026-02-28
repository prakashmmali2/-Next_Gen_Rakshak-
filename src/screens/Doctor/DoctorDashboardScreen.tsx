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
import { DoctorStackParamList, User, AdherenceStat } from '../../types';
import { Card, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { calculateAdherenceRate, getWeeklyAdherence } from '../../services/medicineService';
import { getLinkedPatient } from '../../services/authService';

type DoctorDashboardScreenProps = {
  navigation: NativeStackNavigationProp<DoctorStackParamList, 'DoctorDashboard'>;
};

const screenWidth = Dimensions.get('window').width;

export const DoctorDashboardScreen: React.FC<DoctorDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<User | null>(null);
  const [adherenceRate, setAdherenceRate] = useState(100);
  const [weeklyStats, setWeeklyStats] = useState<AdherenceStat[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      const linkedPatient = await getLinkedPatient(user.id, user.role);
      if (linkedPatient) {
        setPatient(linkedPatient);
        const [rate, weekly] = await Promise.all([
          calculateAdherenceRate(linkedPatient.id),
          getWeeklyAdherence(linkedPatient.id),
        ]);
        setAdherenceRate(rate);
        setWeeklyStats(weekly);
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
            Ask the patient to share their unique code to monitor their health data.
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
            <Text style={styles.doctorName}>Dr. {user?.name}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Card style={styles.patientCard}>
          <View style={styles.patientInfo}>
            <View style={styles.patientAvatar}>
              <Ionicons name="person" size={24} color={colors.secondary} />
            </View>
            <View>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientAge}>{patient.age} years old</Text>
            </View>
          </View>
          <View style={styles.specializationBadge}>
            <Text style={styles.specializationText}>{user?.specialization}</Text>
          </View>
        </Card>

        <Card style={styles.adherenceCard}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.adherenceTitle}>Patient Adherence</Text>
            <View style={[styles.adherenceBadge, { backgroundColor: getAdherenceColor() }]}>
              <Text style={styles.adherenceRate}>{adherenceRate}%</Text>
            </View>
          </View>
          <Text style={styles.adherenceSubtitle}>
            {adherenceRate >= 80 ? 'Patient is compliant with medication' : 'Needs attention'}
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

        <View style={styles.quickActions}>
          <Button
            title="Patient List"
            onPress={() => navigation.navigate('PatientList')}
            style={styles.actionButton}
          />
          <Button
            title="Reports"
            onPress={() => navigation.navigate('PatientAdherenceReport', { patientId: patient.id })}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <Card style={styles.notesCard}>
          <Text style={styles.notesTitle}>Quick Notes</Text>
          <View style={styles.noteItem}>
            <Ionicons name="document-text" size={20} color={colors.secondary} />
            <Text style={styles.noteText}>Review latest adherence report</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="medical" size={20} color={colors.secondary} />
            <Text style={styles.noteText}>Check medication adjustments</Text>
          </View>
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
  doctorName: {
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
    marginBottom: spacing.md,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  patientName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  patientAge: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  specializationBadge: {
    backgroundColor: colors.secondary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  specializationText: {
    fontSize: fontSize.sm,
    color: colors.secondary,
    fontWeight: '500',
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
  notesCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  notesTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  noteText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
