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
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { DoctorStackParamList } from '../../types';
import { Alert } from '../../services/alertService';
import { Card } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getDoctorAlerts, DoctorAlerts } from '../../services/alertService';

type DoctorAlertsScreenProps = {
  navigation: NativeStackNavigationProp<DoctorStackParamList, 'DoctorAlerts'>;
};

export const DoctorAlertsScreen: React.FC<DoctorAlertsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [alertsData, setAlertsData] = useState<DoctorAlerts | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    if (!user) return;

    try {
      const data = await getDoctorAlerts(user.id);
      setAlertsData(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'missed_3_times':
        return 'warning';
      case 'low_adherence':
        return 'alert-circle';
      case 'low_stock':
        return 'medical';
      default:
        return 'information-circle';
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    return severity === 'critical' ? colors.error : colors.warning;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="warning" size={24} color={colors.error} />
            </View>
            <Text style={styles.summaryNumber}>{alertsData?.patientsWithLowAdherence || 0}</Text>
            <Text style={styles.summaryLabel}>Low Adherence</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="medical" size={24} color={colors.warning} />
            </View>
            <Text style={styles.summaryNumber}>{alertsData?.patientsWithMissedMedicines || 0}</Text>
            <Text style={styles.summaryLabel}>Missed Medicines</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="notifications" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.summaryNumber}>{alertsData?.totalAlerts || 0}</Text>
            <Text style={styles.summaryLabel}>Total Alerts</Text>
          </Card>
        </View>

        {/* Alert List */}
        <Text style={styles.sectionTitle}>All Alerts</Text>
        
        {!alertsData || alertsData.alerts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>No Alerts</Text>
            <Text style={styles.emptyText}>
              All your patients are doing well. No alerts at this time.
            </Text>
          </Card>
        ) : (
          alertsData.alerts.map((alert) => (
            <Card key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={[styles.alertIconContainer, { backgroundColor: getAlertColor(alert.severity) + '20' }]}>
                  <Ionicons 
                    name={getAlertIcon(alert.type) as any} 
                    size={20} 
                    color={getAlertColor(alert.severity)} 
                  />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDate}>{formatDate(alert.createdAt)}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: getAlertColor(alert.severity) }]}>
                  <Text style={styles.severityText}>{alert.severity}</Text>
                </View>
              </View>
              
              <Text style={styles.alertMessage}>{alert.message}</Text>
              
              {alert.medicineName && (
                <View style={styles.medicineInfo}>
                  <Ionicons name="medical-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.medicineText}>{alert.medicineName}</Text>
                </View>
              )}
            </Card>
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryNumber: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  alertCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  alertDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },
  alertMessage: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  medicineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  medicineText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
