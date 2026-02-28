import { getDatabase } from '../database/database';
import { MedicineLog } from '../types';

interface TimePattern {
  hour: number;
  minute: number;
  averageTakenHour: number;
  averageTakenMinute: number;
  deviation: number;
}

export const analyzeTimePatterns = async (
  patientId: number,
  medicineId: number
): Promise<TimePattern | null> => {
  const db = await getDatabase();
  
  const logs = await db.getAllAsync<MedicineLog>(
    `SELECT * FROM MedicineLogs 
     WHERE patientId = ? AND medicineId = ? AND status = 'taken' AND takenAt IS NOT NULL
     ORDER BY takenAt DESC
     LIMIT 30`,
    [patientId, medicineId]
  );
  
  if (logs.length < 3) return null;
  
  let totalHour = 0;
  let totalMinute = 0;
  
  logs.forEach(log => {
    if (log.takenAt) {
      const time = new Date(log.takenAt);
      totalHour += time.getHours();
      totalMinute += time.getMinutes();
    }
  });
  
  const avgHour = Math.floor(totalHour / logs.length);
  const avgMinute = Math.floor(totalMinute / logs.length);
  
  // Calculate deviation from scheduled time
  let totalDeviation = 0;
  logs.forEach(log => {
    if (log.takenAt) {
      const takenTime = new Date(log.takenAt);
      const scheduledTime = new Date(log.scheduledTime);
      const diffMinutes = (takenTime.getTime() - scheduledTime.getTime()) / 60000;
      totalDeviation += Math.abs(diffMinutes);
    }
  });
  
  const avgDeviation = totalDeviation / logs.length;
  
  return {
    hour: avgHour,
    minute: avgMinute,
    averageTakenHour: avgHour,
    averageTakenMinute: avgMinute,
    deviation: avgDeviation,
  };
};

export const getOptimalReminderTimes = async (
  patientId: number,
  medicineId: number
): Promise<string[]> => {
  const pattern = await analyzeTimePatterns(patientId, medicineId);
  
  if (!pattern) {
    return [];
  }
  
  // Return optimal times based on user's pattern
  return [`${pattern.averageTakenHour.toString().padStart(2, '0')}:${pattern.averageTakenMinute.toString().padStart(2, '0')}`];
};

export const predictAdherenceTrend = async (
  patientId: number,
  days: number = 7
): Promise<'improving' | 'declining' | 'stable'> => {
  const db = await getDatabase();
  
  const stats = await db.getAllAsync<{ date: string; adherenceRate: number }>(
    `SELECT date, adherenceRate FROM AdherenceStats 
     WHERE patientId = ? 
     AND date >= date('now', '-${days} days')
     ORDER BY date ASC`,
    [patientId]
  );
  
  if (stats.length < 3) return 'stable';
  
  const recentRate = stats.slice(-3).reduce((sum, s) => sum + s.adherenceRate, 0) / 3;
  const olderRate = stats.slice(0, 3).reduce((sum, s) => sum + s.adherenceRate, 0) / 3;
  
  const difference = recentRate - olderRate;
  
  if (difference > 10) return 'improving';
  if (difference < -10) return 'declining';
  return 'stable';
};

export const getSmartSuggestions = async (patientId: number): Promise<string[]> => {
  const db = await getDatabase();
  
  const suggestions: string[] = [];
  
  // Check for missed doses
  const missedToday = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM MedicineLogs 
     WHERE patientId = ? AND date(scheduledTime) = date('now') AND status = 'missed'`,
    [patientId]
  );
  
  if (missedToday && missedToday.count > 0) {
    suggestions.push(`You have ${missedToday.count} missed dose(s) today. Try to take your medicines on time.`);
  }
  
  // Check for low adherence
  const weeklyRate = await db.getFirstAsync<{ avgRate: number }>(
    `SELECT AVG(adherenceRate) as avgRate FROM AdherenceStats 
     WHERE patientId = ? AND date >= date('now', '-7 days')`,
    [patientId]
  );
  
  if (weeklyRate && weeklyRate.avgRate < 70) {
    suggestions.push('Your weekly adherence is below 70%. Consider setting reminders to improve your medication routine.');
  }
  
  // Check for low stock
  const lowStock = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM Medicines WHERE patientId = ? AND stock <= 5`,
    [patientId]
  );
  
  if (lowStock && lowStock.count > 0) {
    suggestions.push(`You have ${lowStock.count} medicine(s) with low stock. Please refill soon.`);
  }
  
  return suggestions;
};
