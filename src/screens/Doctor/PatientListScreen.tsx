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
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { DoctorStackParamList, User } from '../../types';
import { Card } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getPatientsByDoctor, getLinkedPatient } from '../../services/authService';
import { calculateAdherenceRate, getWeeklyAdherence, calculateWeeklyAdherence } from '../../services/medicineService';

type PatientListScreenProps = {
  navigation: NativeStackNavigationProp<DoctorStackParamList, 'PatientList'>;
};

const screenWidth = Dimensions.get('window').width;

interface PatientWithAdherence extends User {
  adherenceRate: number;
}

export const PatientListScreen: React.FC<PatientListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithAdherence[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatients = async () => {
    if (!user) return;

    try {
      const patientsList = await getPatientsByDoctor(user.id);
      
      // Get adherence for each patient
      const patientsWithAdherence = await Promise.all(
        patientsList.map(async (patient) => {
          const adherenceRate = await calculateWeeklyAdherence(patient.id);
          return { ...patient, adherenceRate };
        })
      );
      
      setPatients(patientsWithAdherence);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return colors.success;
    if (rate >= 60) return colors.warning;
    return colors.error;
  };

  const renderPatientCard = ({ item }: { item: PatientWithAdherence }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
    >
      <Card style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person" size={24} color={colors.secondary} />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientAge}>{item.age || 'N/A'} years old</Text>
          </View>
          <View style={[styles.adherenceBadge, { backgroundColor: getAdherenceColor(item.adherenceRate) }]}>
            <Text style={styles.adherenceText}>{item.adherenceRate}%</Text>
          </View>
        </View>
        
        <View style={styles.patientActions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('PatientAdherenceReport', { patientId: item.id })}
          >
            <Ionicons name="stats-chart" size={18} color={colors.secondary} />
            <Text style={styles.actionText}>Adherence</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Appointments')}
          >
            <Ionicons name="calendar" size={18} color={colors.secondary} />
            <Text style={styles.actionText}>Appointments</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Patients</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DoctorAlerts')}>
          <Ionicons name="notifications" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No Patients</Text>
          <Text style={styles.emptyText}>
            Patients will appear here once they link with your account.
          </Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  patientCard: {
    marginBottom: spacing.md,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  patientInfo: {
    flex: 1,
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
  adherenceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  adherenceText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.white,
  },
  patientActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xl,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.secondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
