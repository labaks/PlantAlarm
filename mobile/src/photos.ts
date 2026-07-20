import * as FileSystem from 'expo-file-system/legacy';

const PHOTOS_DIR = `${FileSystem.documentDirectory}plant-photos/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
}

/** Copies a picker/camera result URI into permanent app storage and returns the new URI. */
export async function savePhotoLocally(sourceUri: string): Promise<string> {
  await ensureDir();
  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = `${PHOTOS_DIR}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}
