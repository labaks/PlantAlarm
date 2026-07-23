import { Plant } from './types';
import { deletePhotoFile, readPhotoAsBase64, savePhotoFromBase64 } from './photos';

// Requests can now carry base64 photo bytes, not just JSON metadata, so allow more time.
const REQUEST_TIMEOUT_MS = 30000;

/** Wire format matching the desktop's PlantDto exactly (see Services/PlantDto.cs). */
export interface PlantWireDto {
  id: string;
  name: string;
  intervalDays: number;
  lastWatered: string;
  lastNotifiedDate?: string;
  updatedAt: number;
  deleted: boolean;
  /** Base64 photo bytes — present only if the photo may have changed since lastSyncAt. */
  photo?: string;
  photoExt?: string;
  /** True if the photo was deliberately removed since lastSyncAt. */
  photoRemoved?: boolean;
}

/**
 * Builds the outgoing wire DTO for a plant. Photo bytes are only attached when this plant
 * changed since our last successful sync (or we've never synced before), so routine syncs
 * don't re-upload unchanged photos every time.
 */
export async function toWireDto(plant: Plant, lastSyncAt: number | null): Promise<PlantWireDto> {
  const dto: PlantWireDto = {
    id: plant.id,
    name: plant.name,
    intervalDays: plant.intervalDays,
    lastWatered: plant.lastWatered,
    lastNotifiedDate: plant.lastNotifiedDate,
    updatedAt: plant.updatedAt,
    deleted: !!plant.deleted,
  };

  const changedSinceLastSync = lastSyncAt == null || plant.updatedAt > lastSyncAt;
  if (plant.photoUri) {
    // A photo we have is safe to (re-)send on the first sync too — worst case the other
    // side re-saves bytes it already had.
    if (changedSinceLastSync) {
      try {
        dto.photo = await readPhotoAsBase64(plant.photoUri);
        dto.photoExt = plant.photoUri.split('.').pop()?.split('?')[0] || 'jpg';
      } catch (err) {
        console.warn('[sync] failed to read local photo, sending without it', err);
      }
    }
  } else if (lastSyncAt != null && changedSinceLastSync) {
    // Only claim "removed" once we've synced before — on a first-ever sync, having no local
    // photo just means we've never had one to give, not that one was deleted. Confusing the
    // two here previously wiped out real photos on the other device.
    dto.photoRemoved = true;
  }

  return dto;
}

/**
 * Converts a merged DTO from the desktop's response into a local Plant. Absent photo/photoRemoved
 * means "unchanged since our last sync" — keep whatever photoUri this plant already has locally.
 */
export async function fromWireDto(dto: PlantWireDto, existing: Plant | undefined): Promise<Plant> {
  const plant: Plant = {
    id: dto.id,
    name: dto.name,
    intervalDays: dto.intervalDays,
    lastWatered: dto.lastWatered,
    lastNotifiedDate: dto.lastNotifiedDate,
    updatedAt: dto.updatedAt,
    deleted: dto.deleted,
    photoUri: existing?.photoUri,
  };

  if (dto.photo) {
    try {
      const newUri = await savePhotoFromBase64(dto.photo, dto.photoExt || 'jpg');
      if (existing?.photoUri && existing.photoUri !== newUri) {
        await deletePhotoFile(existing.photoUri);
      }
      plant.photoUri = newUri;
    } catch (err) {
      console.warn('[sync] failed to save incoming photo', err);
    }
  } else if (dto.photoRemoved) {
    await deletePhotoFile(existing?.photoUri);
    plant.photoUri = undefined;
  }

  return plant;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/** Quick reachability check, used by the "test connection" button in sync settings. */
export async function testConnection(host: string, port: number): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`http://${host}:${port}/ping`, { method: 'GET' });
    return res.ok;
  } catch (err) {
    console.warn('[sync] testConnection failed', err);
    return false;
  }
}

/**
 * Pushes the local plant list to the desktop, which merges it with its own list
 * (newest updatedAt per plant wins) and returns the merged result.
 * Returns null if the desktop is unreachable (e.g. not on the same network right now).
 */
export async function syncWithDesktop(
  host: string,
  port: number,
  plants: Plant[],
  lastSyncAt: number | null,
): Promise<Plant[] | null> {
  try {
    const wirePlants = await Promise.all(plants.map((p) => toWireDto(p, lastSyncAt)));
    const res = await fetchWithTimeout(`http://${host}:${port}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plants: wirePlants }),
    });
    if (!res.ok) {
      console.warn('[sync] desktop responded with non-OK status', res.status);
      return null;
    }
    const data = (await res.json()) as { plants: PlantWireDto[] };
    const localById = new Map(plants.map((p) => [p.id, p]));
    return await Promise.all(data.plants.map((dto) => fromWireDto(dto, localById.get(dto.id))));
  } catch (err) {
    console.warn('[sync] syncWithDesktop failed', err);
    return null;
  }
}
