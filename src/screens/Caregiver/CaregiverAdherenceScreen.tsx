import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { CaregiverStackParamList, AdherenceStat, AdherenceDetails } from '../../types';
import { Card } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getWeeklyAdherence, getMonthlyAdherence, calculateAdherenceDetails } from '../../services/medicineService';
import { getLinkedPatient } from '../../services/authService';

type CaregiverAdherenceScreenProps = {
  navigation: NativeStackNavigationProp<CaregiverStackParamList, 'CaregiverAdherence'>;
};

const screenWidth = Dimensions.get('window').width;

export const CaregiverAdherenceScreen: React.FC<CaregiverAdherenceScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [stats, setStats] = useState<AdherenceStat[]>([]);
  const [adherenceDetails, setAdherenceDetails] = useState<AdherenceDetails | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      const linkedPatient = await getLinkedPatient(user.id, user.role);
      if (linkedPatient) {
        setPatient(linkedPatient);
        const [weekly, details] = await Promise.all([
          period === 'weekly' ? getWeeklyAdherence(linkedPatient.id) : getMonthlyAdherence(linkedPatient.id),
          calculateAdherenceDetails(linkedPatient.id),
        ]);
        
        setStats(weekly);
        setAdherenceDetails(details);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user, period])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return colors.success;
    if (rate >= 60) return colors.warning;
    return colors.error;
  };

  const getAdherenceMessage = (rate: number) => {
    if (rate >= 90) return 'Excellent! The patient is doing great!';
    if (rate >= 80) return 'Good adherence. Keep it up!';
    if (rate >= 60) return 'Room for improvement';
    return 'Needs attention - Below 60%';
  };

  const chartData = {
    labels: stats.length > 0 
      ? stats.map(s => s.date.slice(-2))
      : period === 'weekly' 
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : Array.from({ length: 7 }, (_, i) => `${i + 1}`),
    datasets: [
      {
        data: stats.length > 0
          ? stats.map(s => s.adherenceRate || 0)
          : [100, 100, 100, 100, 100, 100, 100],
      },
    ],
  };

  const takenDoses = adherenceDetails?.takenDoses || 0;
  const totalDoses = adherenceDetails?.totalDoses || 0;
  const skipRate = adherenceDetails?.skipRate || 0;
  const missedCount = adherenceDetails?.missedCount || 0;
  const weeklyAdherence = adherenceDetails?.weeklyAdherence || 100;
  const averageDelay = adherenceDetails?.averageDelayTime || 0;
  const mostMissedTime = adherenceDetails?.mostMissedTimePeriod || 'N/A';
  const currentAdherence = adherenceDetails?.adherencePercentage || 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {patient ? `${patient.name}'s Adherence` : 'Adherence'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            View-only - Monitoring patient's medication adherence
          </Text>
        </View>

        <Card style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <Text style={styles.rateTitle}>Current Adherence %</Text>
            <View style={[styles.rateBadge, { backgroundColor: getAdherenceColor(currentAdherence) }]}>
              <Text style={styles.rateValue}>{currentAdherence}%</Text>
            </View>
          </View>
          <Text style={styles.rateMessage}>{getAdherenceMessage(currentAdherence)}</Text>
          
          {currentAdherence < 60 && (
            <View style={styles.alertBanner}>
              <Ionicons name="warning" size={20} color={colors.white} />
              <Text style={styles.alertText}>
                Adherence is below 60% - Needs attention!
              </Text>
            </View>
          )}
        </Card>

        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'weekly' && styles.periodButtonActive]}
            onPress={() => setPeriod('weekly')}
          >
            <Text style={[styles.periodText, period === 'weekly' && styles.periodTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'monthly' && styles.periodButtonActive]}
            onPress={() => setPeriod('monthly')}
          >
            <Text style={[styles.periodText, period === 'monthly' && styles.periodTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {period === 'weekly' ? 'Weekly' : 'Monthly'} Adherence Chart
          </Text>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={200}
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

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.statValue}>{takenDoses}</Text>
            <Text style={styles.statLabel}>Taken</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="medical" size={32} color={colors.secondary} />
            <Text style={styles.statValue}>{totalDoses}</Text>
            <Text style={styles.statLabel}>Total Doses</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="close-circle" size={32} color={colors.error} />
            <Text style={styles.statValue}>{missedCount}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="arrow-redo" size={32} color={colors.warning} />
            <Text style={styles.statValue}>{skipRate}%</Text>
            <Text style={styles.statLabel}>Skip Rate</Text>
          </Card>
        </View>

        <Card style={styles.insightCard}>
          <Text style={styles.insightTitle}>Weekly Adherence</Text>
          <View style={styles.insightRow}>
            <Text style={[
              styles.insightValue, 
              { color: weeklyAdherence < 60 ? colors.error : colors.primary }
            ]}>
              {weeklyAdherence}%
            </Text>
            {weeklyAdherence < 60 && (
              <View style={styles.lowAdherenceBadge}>
                <Text style={styles.lowAdherenceText}>BELOW 60%</Text>
              </View>
            )}
          </View>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="time" size={32} color={colors.accent} />
            <Text style={styles.statValue}>{averageDelay}</Text>
            <Text style={styles.statLabel}>Avg Delay (min)</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="alert-circle" size={32} color={colors.error} />
            <Text style={styles.statValue}>{mostMissedTime}</Text>
            <Text style={styles.statLabel}>Most Missed Time</Text>
          </Card>
        </View>

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
  rateCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rateBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  rateValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  rateMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  alertText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  periodContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  periodTextActive: {
    color: colors.white,
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  insightCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  insightValue: {
    fontSize: fontSize.header,
    fontWeight: 'bold',
    color: colors.primary,
  },
  lowAdherenceBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  lowAdherenceText: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.white,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
