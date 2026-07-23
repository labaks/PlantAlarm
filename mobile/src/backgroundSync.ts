import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';

import { loadPlants, loadSyncSettings, saveSyncSettings, savePlants } from './storage';
import { syncWithDesktop } from './sync';
import { Plant } from './types';

export const SYNC_TASK_NAME = 'plantwidget-daily-sync';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type SyncStatus = 'synced' | 'skipped-too-soon' | 'not-configured' | 'unreachable';

export interface SyncOutcome {
  status: SyncStatus;
  plants?: Plant[];
}

/**
 * Runs one sync round: pushes the local plant list to the desktop and adopts the merged
 * result. `force` bypasses the once-a-day throttle, used by the manual "sync now" button;
 * the background task itself always calls this with force=false.
 */
export async function performSync(force: boolean): Promise<SyncOutcome> {
  const settings = await loadSyncSettings();
  if (!settings.host) return { status: 'not-configured' };

  if (!force && settings.lastSyncAt && Date.now() - settings.lastSyncAt < ONE_DAY_MS) {
    return { status: 'skipped-too-soon' };
  }

  const localPlants = await loadPlants();
  const merged = await syncWithDesktop(settings.host, settings.port, localPlants, settings.lastSyncAt);
  if (!merged) return { status: 'unreachable' };

  await savePlants(merged);
  await saveSyncSettings({ ...settings, lastSyncAt: Date.now() });
  return { status: 'synced', plants: merged };
}

// Must run at module load time (before any component renders) so the OS can invoke this
// task while the app isn't in the foreground.
TaskManager.defineTask(SYNC_TASK_NAME, async () => {
  try {
    const outcome = await performSync(false);
    return outcome.status === 'unreachable'
      ? BackgroundTask.BackgroundTaskResult.Failed
      : BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(SYNC_TASK_NAME);
  if (isRegistered) return;
  // minimumInterval is in minutes and is a lower bound only — the OS decides the actual
  // cadence (Android: 15 min minimum via WorkManager; iOS: opportunistic, often overnight).
  await BackgroundTask.registerTaskAsync(SYNC_TASK_NAME, { minimumInterval: 1440 });
}
