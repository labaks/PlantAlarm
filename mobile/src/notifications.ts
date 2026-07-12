import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Plant, nextWaterDate, today } from './types';

const REMINDER_HOUR = 9;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('watering', {
      name: 'Напоминания о поливе',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }
}

/** Cancels every scheduled reminder and re-schedules one per plant, based on current data. */
export async function rescheduleAll(plants: Plant[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const plant of plants) {
    const due = nextWaterDate(plant);
    let trigger: Notifications.NotificationTriggerInput;

    if (due <= today()) {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: 'watering',
      };
    } else {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(due.getFullYear(), due.getMonth(), due.getDate(), REMINDER_HOUR, 0, 0),
        channelId: 'watering',
      };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Полив цветов',
        body: `${plant.name}: пора полить!`,
      },
      trigger,
    });
  }
}
