import { getDatabase } from '../database/database';
import { Medicine, MedicineLog, AdherenceStat } from '../types';
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

// Medicine Logs
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
  
  // Get the log to find medicineId and patientId
  const log = await db.getFirstAsync<MedicineLog>(
    'SELECT * FROM MedicineLogs WHERE id = ?',
    [logId]
  );
  
  await db.runAsync(
    `UPDATE MedicineLogs SET status = 'taken', takenAt = ?, notes = ? WHERE id = ?`,
    [new Date().toISOString(), notes || '', logId]
  );
  
  // Check and notify if stock is low
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

// Adherence Stats
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
