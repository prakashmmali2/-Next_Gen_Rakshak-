import { getDatabase } from '../database/database';
import { Medicine, AdherenceDetails } from '../types';
import { getMedicinesByPatient, calculateAdherenceDetails, calculateWeeklyAdherence } from './medicineService';

export interface Alert {
  id: string;
  type: 'missed_3_times' | 'low_stock' | 'low_adherence';
  severity: 'warning' | 'critical';
  title: string;
  message: string;
  medicineId?: number;
  medicineName?: string;
  createdAt: string;
}

export interface CaregiverAlerts {
  alerts: Alert[];
  missedCount: number;
  lowStockCount: number;
  lowAdherence: boolean;
}

/**
 * Get count of missed doses for a specific medicine in the last 30 days
 */
export const getMissedCountByMedicine = async (
  medicineId: number,
  patientId: number
): Promise<number> => {
  const db = await getDatabase();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateString = thirtyDaysAgo.toISOString().split('T')[0];
  
  const result = await db.getFirstAsync<{ missedCount: number }>(
    `SELECT COUNT(*) as missedCount 
     FROM MedicineLogs 
     WHERE medicineId = ? 
     AND patientId = ?
     AND date(scheduledTime) >= date(?)
     AND status = 'missed'`,
    [medicineId, patientId, dateString]
  );
  
  return result?.missedCount || 0;
};

/**
 * Get all medicines that have been missed 3 or more times in the last 30 days
 */
export const getMedicinesMissed3Times = async (
  patientId: number
): Promise<{ medicine: Medicine; missedCount: number }[]> => {
  const medicines = await getMedicinesByPatient(patientId);
  const result: { medicine: Medicine; missedCount: number }[] = [];
  
  for (const medicine of medicines) {
    const missedCount = await getMissedCountByMedicine(medicine.id, patientId);
    if (missedCount >= 3) {
      result.push({ medicine, missedCount });
    }
  }
  
  return result;
};

/**
 * Get adherence details for the patient
 */
export const getPatientAdherenceDetails = async (
  patientId: number
): Promise<AdherenceDetails> => {
  return await calculateAdherenceDetails(patientId);
};

/**
 * Get weekly adherence percentage
 */
export const getWeeklyAdherencePercentage = async (
  patientId: number
): Promise<number> => {
  return await calculateWeeklyAdherence(patientId);
};

/**
 * Get all alerts for a caregiver's linked patient
 */
export const getCaregiverAlerts = async (
  patientId: number
): Promise<CaregiverAlerts> => {
  const alerts: Alert[] = [];
  
  // Get medicines
  const medicines = await getMedicinesByPatient(patientId);
  
  // 1. Check for medicines missed 3+ times
  const missed3Times = await getMedicinesMissed3Times(patientId);
  let missedCount = 0;
  
  for (const { medicine, missedCount: count } of missed3Times) {
    missedCount++;
    alerts.push({
      id: `missed_${medicine.id}`,
      type: 'missed_3_times',
      severity: 'critical',
      title: 'Missed Medicine Alert',
      message: `${medicine.name} has been missed ${count} times in the last 30 days`,
      medicineId: medicine.id,
      medicineName: medicine.name,
      createdAt: new Date().toISOString(),
    });
  }
  
  // 2. Check for low stock (stock <= 5)
  let lowStockCount = 0;
  for (const medicine of medicines) {
    if (medicine.stock <= 5) {
      lowStockCount++;
      alerts.push({
        id: `low_stock_${medicine.id}`,
        type: 'low_stock',
        severity: medicine.stock <= 2 ? 'critical' : 'warning',
        title: 'Low Stock Alert',
        message: `${medicine.name} has only ${medicine.stock} doses remaining`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        createdAt: new Date().toISOString(),
      });
    }
  }
  
  // 3. Check for low adherence (<60%)
  const weeklyAdherence = await getWeeklyAdherencePercentage(patientId);
  const lowAdherence = weeklyAdherence < 60;
  
  if (lowAdherence) {
    alerts.push({
      id: 'low_adherence',
      type: 'low_adherence',
      severity: 'critical',
      title: 'Low Adherence Alert',
      message: `Weekly adherence is ${weeklyAdherence}%. This is below the 60% threshold.`,
      createdAt: new Date().toISOString(),
    });
  }
  
  // Sort alerts by severity (critical first)
  alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  return {
    alerts,
    missedCount,
    lowStockCount,
    lowAdherence,
  };
};

/**
 * Check if patient has any critical alerts
 */
export const hasCriticalAlerts = async (patientId: number): Promise<boolean> => {
  const { alerts } = await getCaregiverAlerts(patientId);
  return alerts.some(alert => alert.severity === 'critical');
};

/**
 * Doctor-specific alerts interface
 */
export interface DoctorAlerts {
  alerts: Alert[];
  patientsWithLowAdherence: number;
  patientsWithMissedMedicines: number;
  totalAlerts: number;
}

/**
 * Get all alerts for all patients assigned to a doctor
 */
export const getDoctorAlerts = async (doctorId: number): Promise<DoctorAlerts> => {
  const { getPatientsByDoctor } = await import('./authService');
  const { calculateWeeklyAdherence } = await import('./medicineService');
  
  const patients = await getPatientsByDoctor(doctorId);
  const alerts: Alert[] = [];
  
  let patientsWithLowAdherence = 0;
  let patientsWithMissedMedicines = 0;
  
  for (const patient of patients) {
    // Check weekly adherence
    const weeklyAdherence = await calculateWeeklyAdherence(patient.id);
    
    if (weeklyAdherence < 60) {
      patientsWithLowAdherence++;
      alerts.push({
        id: `low_adherence_${patient.id}`,
        type: 'low_adherence',
        severity: 'critical',
        title: 'Low Adherence Alert',
        message: `${patient.name}'s weekly adherence is ${weeklyAdherence}%. This is below the 60% threshold.`,
        createdAt: new Date().toISOString(),
      });
    } else if (weeklyAdherence < 80) {
      alerts.push({
        id: `medium_adherence_${patient.id}`,
        type: 'low_adherence',
        severity: 'warning',
        title: 'Medium Adherence Alert',
        message: `${patient.name}'s weekly adherence is ${weeklyAdherence}%. Consider monitoring closely.`,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Check for medicines missed 3+ times
    const missed3Times = await getMedicinesMissed3Times(patient.id);
    if (missed3Times.length > 0) {
      patientsWithMissedMedicines++;
      for (const { medicine, missedCount } of missed3Times) {
        alerts.push({
          id: `missed_${medicine.id}_${patient.id}`,
          type: 'missed_3_times',
          severity: 'critical',
          title: 'Repeated Missed Medicine',
          message: `${patient.name} has missed ${medicine.name} ${missedCount} times in the last 30 days.`,
          medicineId: medicine.id,
          medicineName: medicine.name,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
  
  // Sort alerts by severity (critical first)
  alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  return {
    alerts,
    patientsWithLowAdherence,
    patientsWithMissedMedicines,
    totalAlerts: alerts.length,
  };
};
