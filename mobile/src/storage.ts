import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant } from './types';
import type { Language } from './i18n';

const KEY = 'plantwidget.plants';
const SYNC_SETTINGS_KEY = 'plantwidget.syncSettings';
const LANGUAGE_KEY = 'plantwidget.language';

export async function loadPlants(): Promise<Plant[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Plant[];
    // Plants saved before the updatedAt field existed: treat them as "just seen now"
    // rather than leaving updatedAt undefined, so sync conflict resolution stays sane.
    return parsed.map((p) => (p.updatedAt ? p : { ...p, updatedAt: Date.now() }));
  } catch {
    return [];
  }
}

export async function savePlants(plants: Plant[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(plants));
}

export interface SyncSettings {
  /** Desktop's LAN IP address, paired manually once in the settings screen. */
  host: string | null;
  port: number;
  /** Epoch milliseconds of the last successful sync, null if never synced. */
  lastSyncAt: number | null;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = { host: null, port: 8787, lastSyncAt: null };

export async function loadSyncSettings(): Promise<SyncSettings> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SYNC_SETTINGS, ...(JSON.parse(raw) as Partial<SyncSettings>) } : DEFAULT_SYNC_SETTINGS;
  } catch {
    return DEFAULT_SYNC_SETTINGS;
  }
}

export async function saveSyncSettings(settings: SyncSettings): Promise<void> {
  await AsyncStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadLanguage(): Promise<Language | null> {
  try {
    const raw = await AsyncStorage.getItem(LANGUAGE_KEY);
    return raw === 'ru' || raw === 'en' ? raw : null;
  } catch {
    return null;
  }
}

export async function saveLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
