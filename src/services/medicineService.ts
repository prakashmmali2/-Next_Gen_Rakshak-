import { getDatabase } from '../database/database';
import { Medicine, MedicineLog, AdherenceStat, AdherenceDetails } from '../types';
import { checkAndNotifyLowStock } from './stockService';

export const addMedicine = async (
  patientId: number,
  name: string,
  dosage: string,
  frequency: string,
  times: string[],
  stock: number,
  instructions?: string
): Promise<Medicine> => {
  const db = await getDatabase();
  
  const result = await db.runAsync(
    `INSERT INTO Medicines (patientId, name, dosage, frequency, times, stock, instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [patientId, name, dosage, frequency, JSON.stringify(times), stock, instructions || '']
  );
  
  const medicine: Medicine = {
    id: result.lastInsertRowId,
    patientId,
    name,
    dosage,
    frequency,
    times: JSON.stringify(times),
    stock,
    instructions,
    createdAt: new Date().toISOString(),
  };
  
  return medicine;
};

export const getMedicinesByPatient = async (patientId: number): Promise<Medicine[]> => {
  const db = await getDatabase();
  const medicines = await db.getAllAsync<Medicine>(
    'SELECT * FROM Medicines WHERE patientId = ? ORDER BY createdAt DESC',
    [patientId]
  );
  return medicines.map(m => ({
    ...m,
    times: m.times,
  }));
};

export const getMedicineById = async (medicineId: number): Promise<Medicine | null> => {
  const db = await getDatabase();
  const medicine = await db.getFirstAsync<Medicine>(
    'SELECT * FROM Medicines WHERE id = ?',
    [medicineId]
  );
  return medicine || null;
};

export const updateMedicineStock = async (medicineId: number, stock: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('UPDATE Medicines SET stock = ? WHERE id = ?', [stock, medicineId]);
};

export const deleteMedicine = async (medicineId: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM MedicineLogs WHERE medicineId = ?', [medicineId]);
  await db.runAsync('DELETE FROM Medicines WHERE id = ?', [medicineId]);
};

export const createMedicineLog = async (
  medicineId: number,
  patientId: number,
  scheduledTime: string
): Promise<MedicineLog> => {
  const db = await getDatabase();
  
  const result = await db.runAsync(
    `INSERT INTO MedicineLogs (medicineId, patientId, scheduledTime, status)
     VALUES (?, ?, ?, ?)`,
    [medicineId, patientId, scheduledTime, 'pending']
  );
  
  const log: MedicineLog = {
    id: result.lastInsertRowId,
    medicineId,
    patientId,
    scheduledTime,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  return log;
};

export const getTodayLogsByPatient = async (patientId: number): Promise<MedicineLog[]> => {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  const logs = await db.getAllAsync<MedicineLog>(
    `SELECT * FROM MedicineLogs 
     WHERE patientId = ? AND date(scheduledTime) = date(?)
     ORDER BY scheduledTime ASC`,
    [patientId, today]
  );
  
  return logs;
};

export const getLogsByMedicine = async (medicineId: number): Promise<MedicineLog[]> => {
  const db = await getDatabase();
  const logs = await db.getAllAsync<MedicineLog>(
    'SELECT * FROM MedicineLogs WHERE medicineId = ? ORDER BY scheduledTime DESC',
    [medicineId]
  );
  return logs;
};

export const markMedicineTaken = async (
  logId: number,
  notes?: string
): Promise<void> => {
  const db = await getDatabase();
  
  const log = await db.getFirstAsync<MedicineLog>(
    'SELECT * FROM MedicineLogs WHERE id = ?',
    [logId]
  );
  
  await db.runAsync(
    `UPDATE MedicineLogs SET status = 'taken', takenAt = ?, notes = ? WHERE id = ?`,
    [new Date().toISOString(), notes || '', logId]
  );
  
  if (log) {
    await checkAndNotifyLowStock(log.medicineId, log.patientId);
  }
};

export const markMedicineMissed = async (logId: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE MedicineLogs SET status = 'missed' WHERE id = ?`, [logId]);
};

export const markMedicineSkipped = async (logId: number, notes?: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE MedicineLogs SET status = 'skipped', notes = ? WHERE id = ?`,
    [notes || 'Skipped by user', logId]
  );
};

export const calculateAdherenceRate = async (patientId: number): Promise<number> => {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  const result = await db.getFirstAsync<{ total: number; taken: number }>(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken
     FROM MedicineLogs 
     WHERE patientId = ? AND date(scheduledTime) = date(?)`,
    [patientId, today]
  );
  
  if (!result || result.total === 0) return 100;
  
  return Math.round((result.taken / result.total) * 100);
};

export const updateAdherenceStats = async (patientId: number): Promise<void> => {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  
  const result = await db.getFirstAsync<{ total: number; taken: number }>(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken
     FROM MedicineLogs 
     WHERE patientId = ? AND date(scheduledTime) = date(?)`,
    [patientId, today]
  );
  
  const totalDoses = result?.total || 0;
  const takenDoses = result?.taken || 0;
  const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 100;
  
  await db.runAsync(
    `INSERT OR REPLACE INTO AdherenceStats (patientId, date, totalDoses, takenDoses, adherenceRate)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, today, totalDoses, takenDoses, adherenceRate]
  );
};

export const getWeeklyAdherence = async (patientId: number): Promise<AdherenceStat[]> => {
  const db = await getDatabase();
  const stats = await db.getAllAsync<AdherenceStat>(
    `SELECT * FROM AdherenceStats 
     WHERE patientId = ? 
     AND date >= date('now', '-7 days')
     ORDER BY date ASC`,
    [patientId]
  );
  return stats;
};

export const getMonthlyAdherence = async (patientId: number): Promise<AdherenceStat[]> => {
  const db = await getDatabase();
  const stats = await db.getAllAsync<AdherenceStat>(
    `SELECT * FROM AdherenceStats 
     WHERE patientId = ? 
     AND date >= date('now', '-30 days')
     ORDER BY date ASC`,
    [patientId]
  );
  return stats;
};

// ======================
// ADHERENCE INTELLIGENCE ENGINE
// ======================

export const calculateAdherenceDetails = async (patientId: number): Promise<AdherenceDetails> => {
  const db = await getDatabase();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateString = thirtyDaysAgo.toISOString().split('T')[0];
  
  const logs = await db.getAllAsync<MedicineLog>(
    `SELECT * FROM MedicineLogs 
     WHERE patientId = ? AND date(scheduledTime) >= date(?)
     ORDER BY scheduledTime ASC`,
    [patientId, dateString]
  );
  
  const totalDoses = logs.length;
  const takenDoses = logs.filter(l => l.status === 'taken').length;
  const skippedDoses = logs.filter(l => l.status === 'skipped').length;
  const missedDoses = logs.filter(l => l.status === 'missed').length;
  
  const adherencePercentage = totalDoses > 0 
    ? Math.round((takenDoses / totalDoses) * 100) 
    : 100;
  
  const skipRate = totalDoses > 0 
    ? Math.round((skippedDoses / totalDoses) * 100) 
    : 0;
  
  const missedCount = missedDoses;
  
  const weeklyAdherence = await calculateWeeklyAdherence(patientId);
  const averageDelayTime = await calculateAverageDelayTime(patientId);
  const mostMissedTimePeriod = await getMostMissedTimePeriod(patientId);
  
  return {
    adherencePercentage,
    skipRate,
    missedCount,
    weeklyAdherence,
    averageDelayTime,
    mostMissedTimePeriod,
    totalDoses,
    takenDoses,
    skippedDoses,
    missedDoses
  };
};

export const calculateWeeklyAdherence = async (patientId: number): Promise<number> => {
  const db = await getDatabase();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateString = sevenDaysAgo.toISOString().split('T')[0];
  
  const result = await db.getFirstAsync<{ total: number; taken: number }>(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken
     FROM MedicineLogs 
     WHERE patientId = ? AND date(scheduledTime) >= date(?)`,
    [patientId, dateString]
  );
  
  if (!result || result.total === 0) return 100;
  
  return Math.round((result.taken / result.total) * 100);
};

export const calculateAverageDelayTime = async (patientId: number): Promise<number> => {
  const db = await getDatabase();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateString = thirtyDaysAgo.toISOString().split('T')[0];
  
  const logs = await db.getAllAsync<MedicineLog>(
    `SELECT * FROM MedicineLogs 
     WHERE patientId = ? AND date(scheduledTime) >= date(?) AND status = 'taken' AND takenAt IS NOT NULL`,
    [patientId, dateString]
  );
  
  if (logs.length === 0) return 0;
  
  let totalDelay = 0;
  let countWithDelay = 0;
  
  logs.forEach(log => {
    if (log.takenAt) {
      const scheduled = new Date(log.scheduledTime).getTime();
      const taken = new Date(log.takenAt).getTime();
      const delayMinutes = (taken - scheduled) / (1000 * 60);
      
      if (delayMinutes > 0) {
        totalDelay += delayMinutes;
        countWithDelay++;
      }
    }
  });
  
  return countWithDelay > 0 ? Math.round(totalDelay / countWithDelay) : 0;
};

export const getMostMissedTimePeriod = async (patientId: number): Promise<string> => {
  const db = await getDatabase();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateString = thirtyDaysAgo.toISOString().split('T')[0];
  
  const logs = await db.getAllAsync<MedicineLog>(
    `SELECT * FROM MedicineLogs 
     WHERE patientId = ? AND date(scheduledTime) >= date(?) AND (status = 'missed' OR status = 'skipped')`,
    [patientId, dateString]
  );
  
  if (logs.length === 0) return 'No misses recorded';
  
  const timePeriods: Record<string, number> = {
    'Morning': 0,
    'Afternoon': 0,
    'Evening': 0,
    'Night': 0
  };
  
  logs.forEach(log => {
    const hour = new Date(log.scheduledTime).getHours();
    
    if (hour >= 6 && hour < 12) {
      timePeriods['Morning']++;
    } else if (hour >= 12 && hour < 18) {
      timePeriods['Afternoon']++;
    } else if (hour >= 18 && hour < 24) {
      timePeriods['Evening']++;
    } else {
      timePeriods['Night']++;
    }
  });
  
  let maxPeriod = 'Morning';
  let maxCount = 0;
  
  Object.entries(timePeriods).forEach(([period, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxPeriod = period;
    }
  });
  
  return maxCount > 0 ? maxPeriod : 'No misses recorded';
};

export const getDetailedAdherenceStats = async (
  patientId: number, 
  days: number = 7
): Promise<AdherenceStat[]> => {
  const db = await getDatabase();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateString = startDate.toISOString().split('T')[0];
  
  const stats = await db.getAllAsync<AdherenceStat>(
    `SELECT * FROM AdherenceStats 
     WHERE patientId = ? AND date >= date(?)
     ORDER BY date ASC`,
    [patientId, dateString]
  );
  
  return stats;
};
