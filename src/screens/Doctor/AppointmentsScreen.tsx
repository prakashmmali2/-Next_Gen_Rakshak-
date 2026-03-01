import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../utils/theme';
import { DoctorStackParamList, Appointment, User } from '../../types';
import { Card } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getPatientsByDoctor } from '../../services/authService';
import { getDatabase } from '../../database/database';

type AppointmentsScreenProps = {
  navigation: NativeStackNavigationProp<DoctorStackParamList, 'Appointments'>;
};

interface AppointmentWithPatient extends Appointment {
  patientName: string;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      const db = await getDatabase();
      
      // Get appointments for this doctor
      const appointmentData = await db.getAllAsync<Appointment>(
        `SELECT * FROM Appointments 
         WHERE doctorId = ? 
         ORDER BY date ASC, time ASC`,
        [user.id]
      );
      
      // Get patient names
      const patients = await getPatientsByDoctor(user.id);
      const patientMap = new Map(patients.map(p => [p.id, p.name]));
      
      const appointmentsWithPatients = appointmentData.map(apt => ({
        ...apt,
        patientName: patientMap.get(apt.patientId) || 'Unknown Patient',
      }));
      
      setAppointments(appointmentsWithPatients);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return colors.warning;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString >= today;
  };

  const upcomingAppointments = appointments.filter(apt => apt.status === 'scheduled' && isUpcoming(apt.date));
  const pastAppointments = appointments.filter(apt => apt.status !== 'scheduled' || !isUpcoming(apt.date));

  const renderAppointmentCard = (appointment: AppointmentWithPatient) => (
    <Card key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, isToday(appointment.date) && styles.todayText]}>
            {formatDate(appointment.date)}
          </Text>
          <Text style={styles.timeText}>{appointment.time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusText}>{appointment.status}</Text>
        </View>
      </View>
      
      <View style={styles.patientInfo}>
        <Ionicons name="person" size={20} color={colors.secondary} />
        <Text style={styles.patientName}>{appointment.patientName}</Text>
      </View>
      
      {appointment.notes && (
        <Text style={styles.notesText}>{appointment.notes}</Text>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Appointments</Text>
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
            <Ionicons name="calendar" size={24} color={colors.warning} />
            <Text style={styles.summaryNumber}>{upcomingAppointments.length}</Text>
            <Text style={styles.summaryLabel}>Upcoming</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.summaryNumber}>
              {appointments.filter(a => a.status === 'completed').length}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Ionicons name="close-circle" size={24} color={colors.error} />
            <Text style={styles.summaryNumber}>
              {appointments.filter(a => a.status === 'cancelled').length}
            </Text>
            <Text style={styles.summaryLabel}>Cancelled</Text>
          </Card>
        </View>

        {/* Upcoming Appointments */}
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        
        {upcomingAppointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
            <Text style={styles.emptyText}>
              Patients will schedule appointments through the app.
            </Text>
          </Card>
        ) : (
          upcomingAppointments.map(renderAppointmentCard)
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Past Appointments</Text>
            {pastAppointments.map(renderAppointmentCard)}
          </>
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
  summaryNumber: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  appointmentCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  todayText: {
    color: colors.primary,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'capitalize',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  patientName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
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
