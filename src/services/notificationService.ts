import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medicine } from '../types';
import { getAdaptiveReminderTime } from './adaptiveTimeService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === 'granted') {
    return true;
  }
  
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const checkNotificationPermissions = async (): Promise<boolean> => {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
};

export const scheduleMedicineReminder = async (
  medicine: Medicine,
  time: string,
  index: number
): Promise<string | null> => {
  try {
    const times = JSON.parse(medicine.times) as string[];
    const [hours, minutes] = times[index].split(':').map(Number);
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medicine Reminder',
        body: `Time to take ${medicine.name} - ${medicine.dosage}`,
        data: { medicineId: medicine.id, timeIndex: index },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Schedule adaptive medicine reminder - adjusts time based on user's history
 * After 3-5 days of data, the reminder time adjusts to match user's patterns
 * 
 * Example:
 * - Scheduled: 12:30
 * - Average Delay: +4 min
 * - Next reminder: 12:34
 */
export const scheduleAdaptiveReminder = async (
  medicine: Medicine,
  patientId: number,
  time: string,
  index: number
): Promise<{
  identifier: string | null;
  isAdaptive: boolean;
  scheduledTime: string;
  adaptiveTime: string;
  meanDelay: number;
}> => {
  try {
    // Create a date object with the scheduled time
    const today = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);
    const scheduledISO = today.toISOString();
    
    // Get adaptive time info
    const adaptiveInfo = await getAdaptiveReminderTime(
      patientId,
      medicine.id,
      scheduledISO
    );
    
    const [adaptiveHours, adaptiveMinutes] = adaptiveInfo.adaptiveTime.split(':').map(Number);
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: adaptiveInfo.isAdaptive ? '🎯 Adaptive Medicine Reminder' : '💊 Medicine Reminder',
        body: adaptiveInfo.isAdaptive
          ? `Time to take ${medicine.name} - ${medicine.dosage} (adjusted by ${adaptiveInfo.meanDelay} min based on your habits)`
          : `Time to take ${medicine.name} - ${medicine.dosage}`,
        data: { 
          medicineId: medicine.id, 
          timeIndex: index,
          isAdaptive: adaptiveInfo.isAdaptive,
          meanDelay: adaptiveInfo.meanDelay
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: adaptiveHours,
        minute: adaptiveMinutes,
      },
    });
    
    return {
      identifier,
      isAdaptive: adaptiveInfo.isAdaptive,
      scheduledTime: time,
      adaptiveTime: adaptiveInfo.adaptiveTime,
      meanDelay: adaptiveInfo.meanDelay
    };
  } catch (error) {
    console.error('Error scheduling adaptive notification:', error);
    return {
      identifier: null,
      isAdaptive: false,
      scheduledTime: time,
      adaptiveTime: time,
      meanDelay: 0
    };
  }
};

/**
 * Reschedule all medicine notifications with adaptive timing
 */
export const rescheduleAllAdaptiveReminders = async (
  patientId: number,
  medicines: Medicine[]
): Promise<{
  scheduled: number;
  failed: number;
  adaptiveCount: number;
}> => {
  let scheduled = 0;
  let failed = 0;
  let adaptiveCount = 0;
  
  // Cancel all existing notifications first
  await cancelAllNotifications();
  
  for (const medicine of medicines) {
    const times = JSON.parse(medicine.times) as string[];
    
    for (let i = 0; i < times.length; i++) {
      const result = await scheduleAdaptiveReminder(
        medicine,
        patientId,
        times[i],
        i
      );
      
      if (result.identifier) {
        scheduled++;
        if (result.isAdaptive) {
          adaptiveCount++;
        }
      } else {
        failed++;
      }
    }
  }
  
  return { scheduled, failed, adaptiveCount };
};

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const cancelNotification = async (identifier: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(identifier);
};

export const sendInstantNotification = async (
  title: string,
  body: string
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
};

export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};
