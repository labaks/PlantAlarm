import { Plant } from './types';

const REQUEST_TIMEOUT_MS = 5000;

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
export async function syncWithDesktop(host: string, port: number, plants: Plant[]): Promise<Plant[] | null> {
  try {
    const res = await fetchWithTimeout(`http://${host}:${port}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plants }),
    });
    if (!res.ok) {
      console.warn('[sync] desktop responded with non-OK status', res.status);
      return null;
    }
    const data = (await res.json()) as { plants: Plant[] };
    return data.plants;
  } catch (err) {
    console.warn('[sync] syncWithDesktop failed', err);
    return null;
  }
}
