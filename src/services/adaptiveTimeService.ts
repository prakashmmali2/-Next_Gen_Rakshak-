import { getDatabase } from '../database/database';
import { MedicineLog, Medicine } from '../types';

// Minimum days of data needed before adaptive timing kicks in
const MIN_DAYS_FOR_ADAPTIVE = 3;
const MAX_DAYS_TO_ANALYZE = 5;

interface TimePattern {
  hour: number;
  minute: number;
  averageTakenHour: number;
  averageTakenMinute: number;
  deviation: number;
}

interface AdaptiveTimeInfo {
  scheduledTime: string;
  adaptiveTime: string;
  meanDelay: number;
  isAdaptive: boolean;
  daysAnalyzed: number;
}

/**
 * Calculate Mean Delay for a specific medicine
 * Mean Delay = Sum(Actual Taken Time - Scheduled Time) / Total Days
 */
export const calculateMeanDelay = async (
  patientId: number,
  medicineId: number
): Promise<{ meanDelay: number; daysAnalyzed: number }> => {
  const db = await getDatabase();
  
  // Get logs from the last MAX_DAYS_TO_ANALYZE days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - MAX_DAYS_TO_ANALYZE);
  const dateString = startDate.toISOString().split('T')[0];
  
  const logs = await db.getAllAsync<MedicineLog>(
    `SELECT * FROM MedicineLogs 
     WHERE patientId = ? AND medicineId = ? 
     AND status = 'taken' AND takenAt IS NOT NULL
     AND date(scheduledTime) >= date(?)
     ORDER BY scheduledTime DESC`,
    [patientId, medicineId, dateString]
  );
  
  // Need at least MIN_DAYS_FOR_ADAPTIVE days of data
  if (logs.length < MIN_DAYS_FOR_ADAPTIVE) {
    return { meanDelay: 0, daysAnalyzed: logs.length };
  }
  
  let totalDelayMinutes = 0;
  
  logs.forEach(log => {
    if (log.takenAt) {
      const scheduledTime = new Date(log.scheduledTime).getTime();
      const takenTime = new Date(log.takenAt).getTime();
      
      // Calculate delay in minutes (can be positive or negative)
      const delayMinutes = (takenTime - scheduledTime) / (1000 * 60);
      
      // Only count positive delays (when user takes medicine late)
      // Negative delays (early) are not counted as "delay"
      if (delayMinutes > 0) {
        totalDelayMinutes += delayMinutes;
      }
    }
  });
  
  // Mean Delay = Sum of delays / Total days
  const meanDelay = totalDelayMinutes / logs.length;
  
  return {
    meanDelay: Math.round(meanDelay),
    daysAnalyzed: logs.length
  };
};

/**
 * Get adaptive reminder time by adding mean delay to scheduled time
 * Example: Scheduled: 12:30, Average Delay: +4 min, Next reminder: 12:34
 */
export const getAdaptiveReminderTime = async (
  patientId: number,
  medicineId: number,
  scheduledTime: string
): Promise<AdaptiveTimeInfo> => {
  const { meanDelay, daysAnalyzed } = await calculateMeanDelay(patientId, medicineId);
  
  const scheduled = new Date(scheduledTime);
  const adaptiveDate = new Date(scheduled.getTime() + meanDelay * 60 * 1000);
  
  const adaptiveTime = `${adaptiveDate.getHours().toString().padStart(2, '0')}:${adaptiveDate.getMinutes().toString().padStart(2, '0')}`;
  
  return {
    scheduledTime: scheduledTime,
    adaptiveTime: adaptiveTime,
    meanDelay: meanDelay,
    isAdaptive: daysAnalyzed >= MIN_DAYS_FOR_ADAPTIVE,
    daysAnalyzed
  };
};

/**
 * Get all adaptive reminder times for a medicine
 */
export const getAllAdaptiveReminderTimes = async (
  patientId: number,
  medicine: Medicine
): Promise<AdaptiveTimeInfo[]> => {
  const times = JSON.parse(medicine.times) as string[];
  
  const adaptiveTimes: AdaptiveTimeInfo[] = await Promise.all(
    times.map(async (time) => {
      // Create a dummy date with the time to pass to getAdaptiveReminderTime
      const today = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      
      return getAdaptiveReminderTime(
        patientId, 
        medicine.id, 
        today.toISOString()
      );
    })
  );
  
  return adaptiveTimes;
};

/**
 * Analyze time patterns for a medicine
 */
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

/**
 * Get optimal reminder times based on user's pattern
 */
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

/**
 * Check if adaptive timing is available for a medicine
 */
export const isAdaptiveTimingAvailable = async (
  patientId: number,
  medicineId: number
): Promise<boolean> => {
  const { daysAnalyzed } = await calculateMeanDelay(patientId, medicineId);
  return daysAnalyzed >= MIN_DAYS_FOR_ADAPTIVE;
};

/**
 * Get summary of adaptive timing for all patient's medicines
 */
export const getAdaptiveTimingSummary = async (
  patientId: number
): Promise<{
  medicinesWithAdaptiveTiming: number;
  medicinesPendingData: number;
  overallAverageDelay: number;
}> => {
  const db = await getDatabase();
  
  const medicines = await db.getAllAsync<Medicine>(
    'SELECT * FROM Medicines WHERE patientId = ?',
    [patientId]
  );
  
  let adaptiveCount = 0;
  let pendingCount = 0;
  let totalDelay = 0;
  let delayCount = 0;
  
  for (const medicine of medicines) {
    const { meanDelay, daysAnalyzed } = await calculateMeanDelay(patientId, medicine.id);
    
    if (daysAnalyzed >= MIN_DAYS_FOR_ADAPTIVE) {
      adaptiveCount++;
      totalDelay += meanDelay;
      delayCount++;
    } else {
      pendingCount++;
    }
  }
  
  return {
    medicinesWithAdaptiveTiming: adaptiveCount,
    medicinesPendingData: pendingCount,
    overallAverageDelay: delayCount > 0 ? Math.round(totalDelay / delayCount) : 0
  };
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
  
  // Check if adaptive timing is available
  const adaptiveSummary = await getAdaptiveTimingSummary(patientId);
  if (adaptiveSummary.medicinesWithAdaptiveTiming > 0) {
    suggestions.push(`🎯 Adaptive timing is now active for ${adaptiveSummary.medicinesWithAdaptiveTiming} medicine(s). Your reminders are now personalized!`);
  } else if (adaptiveSummary.medicinesPendingData > 0) {
    suggestions.push(`⏳ Keep taking your medicines to unlock adaptive reminders! ${adaptiveSummary.medicinesPendingData} more medicine(s) need more data.`);
  }
  
  return suggestions;
};
