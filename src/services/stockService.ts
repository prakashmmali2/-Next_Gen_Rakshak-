import { getDatabase } from '../database/database';
import { Medicine, User, Relationship } from '../types';
import { sendInstantNotification } from './notificationService';

export const getLowStockMedicines = async (patientId: number): Promise<Medicine[]> => {
  const db = await getDatabase();
  const medicines = await db.getAllAsync<Medicine>(
    'SELECT * FROM Medicines WHERE patientId = ? AND stock <= 2 ORDER BY stock ASC',
    [patientId]
  );
  return medicines;
};

export const getOutOfStockMedicines = async (patientId: number): Promise<Medicine[]> => {
  const db = await getDatabase();
  const medicines = await db.getAllAsync<Medicine>(
    'SELECT * FROM Medicines WHERE patientId = ? AND stock = 0 ORDER BY name ASC',
    [patientId]
  );
  return medicines;
};

export const updateStock = async (medicineId: number, newStock: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('UPDATE Medicines SET stock = ? WHERE id = ?', [newStock, medicineId]);
};

export const decrementStock = async (medicineId: number): Promise<number> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE Medicines SET stock = CASE WHEN stock > 0 THEN stock - 1 ELSE 0 END WHERE id = ?',
    [medicineId]
  );
  
  const medicine = await db.getFirstAsync<Medicine>(
    'SELECT stock FROM Medicines WHERE id = ?',
    [medicineId]
  );
  
  return medicine?.stock || 0;
};

export const getTotalMedicinesCount = async (patientId: number): Promise<number> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM Medicines WHERE patientId = ?',
    [patientId]
  );
  return result?.count || 0;
};

export const getTotalStockValue = async (patientId: number): Promise<number> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT SUM(stock) as total FROM Medicines WHERE patientId = ?',
    [patientId]
  );
  return result?.total || 0;
};

// Get linked caregivers for a patient
export const getLinkedCaregivers = async (patientId: number): Promise<User[]> => {
  const db = await getDatabase();
  const relationships = await db.getAllAsync<Relationship>(
    'SELECT * FROM Relationships WHERE patientId = ?',
    [patientId]
  );
  
  const caregivers: User[] = [];
  
  for (const rel of relationships) {
    if (rel.caregiverId) {
      const caregiver = await db.getFirstAsync<User>(
        'SELECT * FROM Users WHERE id = ?',
        [rel.caregiverId]
      );
      if (caregiver) {
        caregivers.push(caregiver);
      }
    }
  }
  
  return caregivers;
};

// Get patient by ID
export const getPatientById = async (patientId: number): Promise<User | null> => {
  const db = await getDatabase();
  const patient = await db.getFirstAsync<User>(
    'SELECT * FROM Users WHERE id = ?',
    [patientId]
  );
  return patient || null;
};

// Send stock notification to patient and caregivers
export const sendStockNotification = async (
  patientId: number,
  medicineName: string,
  currentStock: number
): Promise<void> => {
  const stockMessage = `Medicine stock is finishing. Please refill. ${medicineName} has only ${currentStock} remaining.`;
  
  // Notify patient
  await sendInstantNotification(
    '💊 Medicine Stock Alert',
    stockMessage
  );
  
  // Get and notify caregivers
  const caregivers = await getLinkedCaregivers(patientId);
  
  for (const caregiver of caregivers) {
    await sendInstantNotification(
      '💊 Caregiver: Medicine Stock Alert',
      `${stockMessage} Patient ID: ${patientId}`
    );
  }
};

// Check and notify if stock is low after decrement
export const checkAndNotifyLowStock = async (
  medicineId: number,
  patientId: number
): Promise<{ shouldNotify: boolean; medicineName: string; currentStock: number }> => {
  const newStock = await decrementStock(medicineId);
  
  if (newStock <= 2) {
    // Get medicine name
    const db = await getDatabase();
    const medicine = await db.getFirstAsync<Medicine>(
      'SELECT * FROM Medicines WHERE id = ?',
      [medicineId]
    );
    
    if (medicine) {
      await sendStockNotification(patientId, medicine.name, newStock);
      return { shouldNotify: true, medicineName: medicine.name, currentStock: newStock };
    }
  }
  
  return { shouldNotify: false, medicineName: '', currentStock: newStock };
};
