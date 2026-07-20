import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loadLanguage, saveLanguage } from './storage';

export type Language = 'ru' | 'en';

const TABLE: Record<string, [string, string]> = {
  app_title: ['Мои цветы', 'My Plants'],
  empty_list: ['Пока нет цветов — добавьте первый кнопкой «+».', 'No plants yet — add your first one with the “+” button.'],

  status_overdue: ['Просрочено на {0}', '{0} overdue'],
  status_due_today: ['Пора поливать!', 'Time to water!'],
  status_tomorrow: ['Завтра', 'Tomorrow'],
  status_in_days: ['Через {0}', 'In {0}'],

  confirm_title: ['Подтверждение', 'Confirm'],
  delete_button: ['Удалить', 'Delete'],
  water_button: ['Полить', 'Water'],
  cancel_button: ['Отмена', 'Cancel'],
  delete_confirm_message: ['Удалить «{0}» из списка?', 'Delete “{0}” from the list?'],
  water_early_message: ["До полива «{0}» осталось {1}. Полить сейчас?", "{0} isn't due for {1}. Water now?"],

  add_title: ['Новый цветок', 'New plant'],
  edit_title: ['Редактировать цветок', 'Edit plant'],
  name_label: ['Название', 'Name'],
  name_placeholder: ['Например, Фикус', 'e.g. Ficus'],
  interval_label: ['Поливать раз в (дней)', 'Water every (days)'],
  days_ago_label: ['Дней с последнего полива', 'Days since last watered'],
  save_button: ['Сохранить', 'Save'],
  err_name_required: ['Введите название растения.', 'Enter a plant name.'],
  err_interval_invalid: ['Интервал должен быть положительным числом дней.', 'Interval must be a positive number of days.'],
  err_days_ago_invalid: ['Дней с последнего полива — число 0 или больше.', 'Days since last watered must be 0 or greater.'],
  photo_camera_button: ['Камера', 'Camera'],
  photo_gallery_button: ['Галерея', 'Gallery'],
  photo_remove_button: ['Удалить', 'Remove'],
  photo_permission_denied: ['Нет доступа. Разрешите доступ в настройках телефона.', "No access. Please allow access in your phone's settings."],
  opt_notification_sound: ['Звук уведомления', 'Notification sound'],

  sync_title: ['Синхронизация с десктопом', 'Sync with desktop'],
  sync_host_label: ['IP-адрес десктопа', 'Desktop IP address'],
  sync_host_placeholder: ['Например, 192.168.1.23', 'e.g. 192.168.1.23'],
  sync_port_label: ['Порт', 'Port'],
  sync_hint: [
    'Адрес и порт показаны в настройках десктопного виджета. Синхронизация работает, только пока оба устройства в одной локальной сети; в фоне выполняется примерно раз в сутки.',
    "The address and port are shown in the desktop widget's settings. Sync only works while both devices are on the same local network; it also runs in the background about once a day.",
  ],
  sync_last_label: ['Последняя синхронизация: {0}', 'Last synced: {0}'],
  sync_never: ['ещё не выполнялась', 'never'],
  sync_test_button: ['Проверить', 'Test'],
  sync_now_button: ['Синхронизировать сейчас', 'Sync now'],
  close_button: ['Закрыть', 'Close'],
  sync_status_synced: ['Синхронизировано успешно.', 'Synced successfully.'],
  sync_status_unreachable: [
    'Не удалось подключиться к десктопу. Убедитесь, что оба устройства в одной Wi-Fi сети.',
    "Couldn't reach the desktop. Make sure both devices are on the same Wi-Fi network.",
  ],
  sync_status_not_configured: ['Сначала укажите и сохраните адрес десктопа.', "Enter and save the desktop's address first."],
  sync_status_skipped: ['Уже синхронизировали недавно.', 'Already synced recently.'],
  sync_status_saved: ['Адрес сохранён.', 'Address saved.'],
  sync_status_enter_ip: ['Введите IP-адрес десктопа.', "Enter the desktop's IP address."],
  sync_status_testing: ['Проверяем соединение…', 'Testing connection…'],
  sync_status_found: ['Десктоп найден ✓', 'Desktop found ✓'],
  sync_status_not_responding: ['Не отвечает. Проверьте адрес и сеть.', 'Not responding. Check the address and network.'],
  sync_syncing: ['Синхронизация…', 'Syncing…'],

  settings_title: ['Настройки', 'Settings'],
  language_label: ['Язык', 'Language'],

  notif_channel_name: ['Напоминания о поливе', 'Watering reminders'],
  notif_title: ['Полив цветов', 'Plant Watering'],
  notif_due_body: ['{0}: пора полить!', '{0}: time to water!'],
};

export function translate(key: string, language: Language, ...args: (string | number)[]): string {
  const entry = TABLE[key];
  let text = language === 'en' ? entry[1] : entry[0];
  args.forEach((arg, i) => {
    text = text.replace(`{${i}}`, String(arg));
  });
  return text;
}

/** "5 дн." in Russian (no plural agreement needed); "1 day" / "5 days" in English. */
export function formatDays(n: number, language: Language): string {
  return language === 'en' ? `${n} day${n === 1 ? '' : 's'}` : `${n} дн.`;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    (async () => {
      const saved = await loadLanguage();
      if (saved) setLanguageState(saved);
    })();
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    saveLanguage(next);
  };

  const t = (key: string, ...args: (string | number)[]) => translate(key, language, ...args);

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
