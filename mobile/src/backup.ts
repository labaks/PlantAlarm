import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { Plant } from './types';
import { PlantWireDto, fromWireDto, toWireDto } from './sync';

/**
 * Builds a full backup file (same wire shape as /sync, so it's also importable on the desktop)
 * and opens the share sheet so the user can save it somewhere durable (Drive, email, etc).
 * Unlike a routine sync, every plant's photo is always embedded regardless of lastSyncAt.
 */
export async function exportBackup(plants: Plant[]): Promise<void> {
  const wirePlants = await Promise.all(plants.map((p) => toWireDto(p, null)));
  const json = JSON.stringify({ plants: wirePlants }, null, 2);

  const fileName = `plantwidget-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: fileName });
  }
}

/**
 * Lets the user pick a backup file and returns the full plant list it contains, ready to
 * replace the current one. Returns null if the user cancelled the picker.
 */
export async function importBackup(): Promise<Plant[] | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
  if (result.canceled || !result.assets?.[0]) return null;

  const json = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const data = JSON.parse(json) as { plants: PlantWireDto[] };
  return Promise.all(data.plants.map((dto) => fromWireDto(dto, undefined)));
}
