import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../utils/theme';
import { PatientStackParamList, Medicine, AdherenceStat } from '../../types';
import { Card, Button, MedicineCard } from '../../components';
import { useAuth } from '../../context/AuthContext';
import {
  getMedicinesByPatient,
  getTodayLogsByPatient,
  calculateAdherenceRate,
  getWeeklyAdherence,
} from '../../services/medicineService';
import { getLowStockMedicines } from '../../services/stockService';

type PatientHomeScreenProps = {
  navigation: NativeStackNavigationProp<PatientStackParamList, 'PatientHome'>;
};

const screenWidth = Dimensions.get('window').width;

export const PatientHomeScreen: React.FC<PatientHomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [adherenceRate, setAdherenceRate] = useState(100);
  const [weeklyStats, setWeeklyStats] = useState<AdherenceStat[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      const [meds, rate, weekly, lowStock] = await Promise.all([
        getMedicinesByPatient(user.id),
        calculateAdherenceRate(user.id),
        getWeeklyAdherence(user.id),
        getLowStockMedicines(user.id),
      ]);

      setMedicines(meds);
      setAdherenceRate(rate);
      setWeeklyStats(weekly);
      setLowStockCount(lowStock.length);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <View style={styles.notificationBadge}>
            <Ionicons name="notifications" size={24} color={colors.textPrimary} />
            {lowStockCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{lowStockCount}</Text>
              </View>
            )}
          </View>
        </View>

        <Card style={styles.adherenceCard}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.adherenceTitle}>Today's Adherence</Text>
            <View style={[styles.adherenceBadge, { backgroundColor: getAdherenceColor() }]}>
              <Text style={styles.adherenceRate}>{adherenceRate}%</Text>
            </View>
          </View>
          <Text style={styles.adherenceSubtitle}>
            {adherenceRate >= 80 ? 'Great job! Keep it up!' : 'Take your medicines on time'}
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
            title="Add Medicine"
            onPress={() => navigation.navigate('AddMedicine')}
            style={styles.actionButton}
          />
          <Button
            title="Face Scan"
            onPress={() => navigation.navigate('FaceScan')}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Medicines</Text>
          <Button
            title="See All"
            onPress={() => navigation.navigate('PatientMedicines')}
            variant="outline"
            size="small"
          />
        </View>

        {medicines.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="medical-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No medicines added yet</Text>
            <Button
              title="Add Your First Medicine"
              onPress={() => navigation.navigate('AddMedicine')}
              size="small"
            />
          </Card>
        ) : (
          medicines.slice(0, 3).map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onPress={() => navigation.navigate('MedicineDetail', { medicineId: medicine.id })}
            />
          ))
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
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  notificationBadge: {
    position: 'relative',
    padding: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginVertical: spacing.md,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
