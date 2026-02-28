import React, { useState, useEffect } from 'react';
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
import { LineChart, BarChart } from 'react-native-chart-kit';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../utils/theme';
import { PatientStackParamList, AdherenceStat } from '../../types';
import { Card } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getWeeklyAdherence, getMonthlyAdherence, calculateAdherenceRate } from '../../services/medicineService';

type PatientAdherenceScreenProps = {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'PatientAdherence'>;
};

const screenWidth = Dimensions.get('window').width;

export const PatientAdherenceScreen: React.FC<PatientAdherenceScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [stats, setStats] = useState<AdherenceStat[]>([]);
  const [adherenceRate, setAdherenceRate] = useState(100);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    if (!user) return;

    try {
      const [weekly, rate] = await Promise.all([
        period === 'weekly' ? getWeeklyAdherence(user.id) : getMonthlyAdherence(user.id),
        calculateAdherenceRate(user.id),
      ]);
      
      setStats(weekly);
      setAdherenceRate(rate);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user, period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return colors.success;
    if (rate >= 60) return colors.warning;
    return colors.error;
  };

  const getAdherenceMessage = (rate: number) => {
    if (rate >= 90) return 'Excellent! You\'re doing great!';
    if (rate >= 80) return 'Good job! Keep it up!';
    if (rate >= 60) return 'Room for improvement';
    return 'Needs attention';
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

  const takenDoses = stats.reduce((sum, s) => sum + s.takenDoses, 0);
  const totalDoses = stats.reduce((sum, s) => sum + s.totalDoses, 0);

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
          <Text style={styles.title}>Adherence</Text>
          <View style={{ width: 24 }} />
        </View>

        <Card style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <Text style={styles.rateTitle}>Overall Adherence</Text>
            <View style={[styles.rateBadge, { backgroundColor: getAdherenceColor(adherenceRate) }]}>
              <Text style={styles.rateValue}>{adherenceRate}%</Text>
            </View>
          </View>
          <Text style={styles.rateMessage}>{getAdherenceMessage(adherenceRate)}</Text>
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
            {period === 'weekly' ? 'Weekly' : 'Monthly'} Overview
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
            <Text style={styles.statLabel}>Doses Taken</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="medical" size={32} color={colors.secondary} />
            <Text style={styles.statValue}>{totalDoses}</Text>
            <Text style={styles.statLabel}>Total Doses</Text>
          </Card>
        </View>

        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips to Improve</Text>
          <View style={styles.tipItem}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={styles.tipText}>Set reminders at the same time daily</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.tipText}>Keep medicines in a visible place</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="journal" size={20} color={colors.primary} />
            <Text style={styles.tipText}>Track your doses in the app</Text>
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
  title: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
  tipsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    flex: 1,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
