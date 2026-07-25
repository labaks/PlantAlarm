import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { Plant } from './types';
import { PlantWireDto, fromWireDto, toWireDto } from './sync';

/**
 * Builds a full backup file (same wire shape as /sync, so it's also importable on the desktop)
 * and lets the user pick a real folder to save it to via Android's Storage Access Framework —
 * the same "Save As" experience as the desktop's file dialog, instead of just handing the file
 * to the share sheet and hoping the user picks a target that actually keeps a copy of it.
 * Unlike a routine sync, every plant's photo is always embedded regardless of lastSyncAt.
 *
 * Returns false if the user backed out of the folder picker without saving anything (treated
 * like a cancelled import — no error, nothing was written anywhere the user would notice).
 */
export async function exportBackup(plants: Plant[]): Promise<boolean> {
  const wirePlants = await Promise.all(plants.map((p) => toWireDto(p, null)));
  const json = JSON.stringify({ plants: wirePlants }, null, 2);
  const fileName = `plantwidget-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const { StorageAccessFramework } = FileSystem;
  if (StorageAccessFramework) {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return false;

    const fileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      'application/json',
    );
    await StorageAccessFramework.writeAsStringAsync(fileUri, json);
    return true;
  }

  // iOS has no Storage Access Framework equivalent — share sheet remains the only way to get a
  // file out of the app there, and "Save to Files" is one of its standard built-in targets.
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: fileName });
  }
  return true;
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
