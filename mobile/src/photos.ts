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

/** Writes photo bytes received from the desktop during sync into permanent app storage. */
export async function savePhotoFromBase64(base64: string, ext: string): Promise<string> {
  await ensureDir();
  const dest = `${PHOTOS_DIR}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await FileSystem.writeAsStringAsync(dest, base64, { encoding: 'base64' });
  return dest;
}

/** Reads a local plant photo as base64, to embed in an outgoing sync request. */
export function readPhotoAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
}

/** Best-effort delete of a plant photo that's being replaced or removed. */
export async function deletePhotoFile(uri: string | undefined): Promise<void> {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // orphaned file cleanup is best-effort, not worth failing the caller over
  }
}
