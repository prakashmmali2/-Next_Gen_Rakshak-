import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medicine } from '../types';

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
