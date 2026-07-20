import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Plant, nextWaterDate, today } from './types';
import { Language, translate } from './i18n';

const REMINDER_HOUR = 9;
const CHANNEL_ID = 'watering';
const SILENT_CHANNEL_ID = 'watering-silent';

// Read by the foreground notification handler below; kept in sync with the persisted
// setting by App.tsx so a just-changed toggle applies without needing a reload.
let soundEnabled = true;
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: soundEnabled,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function setupNotificationChannel(language: Language): Promise<void> {
  if (Platform.OS === 'android') {
    // Android ties sound to the channel (fixed once created), not to each notification —
    // so a silent variant is a separate channel, picked per-schedule based on the setting.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: translate('notif_channel_name', language),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
    await Notifications.setNotificationChannelAsync(SILENT_CHANNEL_ID, {
      name: translate('notif_channel_name', language),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: null,
    });
  }
}

/** Cancels every scheduled reminder and re-schedules one per plant, based on current data. */
export async function rescheduleAll(plants: Plant[], language: Language, soundOn: boolean): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const channelId = soundOn ? CHANNEL_ID : SILENT_CHANNEL_ID;

  for (const plant of plants) {
    const due = nextWaterDate(plant);
    let trigger: Notifications.NotificationTriggerInput;

    if (due <= today()) {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId,
      };
    } else {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(due.getFullYear(), due.getMonth(), due.getDate(), REMINDER_HOUR, 0, 0),
        channelId,
      };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌱 ${translate('notif_title', language)}`,
        body: translate('notif_due_body', language, plant.name),
      },
      trigger,
    });
  }
}
