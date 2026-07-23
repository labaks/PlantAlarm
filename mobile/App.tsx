import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { PlantRow } from './src/components/PlantRow';
import { PlantFormModal } from './src/components/PlantFormModal';
import { ConfirmModal } from './src/components/ConfirmModal';
import { SettingsModal } from './src/components/SettingsModal';
import { SyncSettingsModal } from './src/components/SyncSettingsModal';
import { BackupModal } from './src/components/BackupModal';
import { theme } from './src/theme';
import { loadPlants, loadSoundEnabled, savePlants, saveSoundEnabled } from './src/storage';
import { performSync, registerBackgroundSync } from './src/backgroundSync';
import { deletePhotoFile } from './src/photos';
import { ensureNotificationPermission, rescheduleAll, setSoundEnabled, setupNotificationChannel } from './src/notifications';
import { Plant, daysLeft, formatDate, generatePlantId, isWaterable, nowMs, today } from './src/types';
import { LanguageProvider, formatDays, useLanguage } from './src/i18n';

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { language, t } = useLanguage();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);
  const [earlyWaterPlant, setEarlyWaterPlant] = useState<Plant | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [syncSettingsVisible, setSyncSettingsVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      await setupNotificationChannel(language);
      await ensureNotificationPermission();
      const stored = await loadPlants();
      setPlants(stored);
      const storedSoundEnabled = await loadSoundEnabled();
      setSoundEnabledState(storedSoundEnabled);
      setSoundEnabled(storedSoundEnabled);
      setLoaded(true);
      await registerBackgroundSync();

      // Background task cadence is opportunistic (OS-decided, often overnight), so also try
      // right on launch — same once-a-day throttle, just not stuck waiting on the OS scheduler.
      const outcome = await performSync(false);
      if (outcome.status === 'synced' && outcome.plants) {
        setPlants(outcome.plants);
      }
    })();

    const interval = setInterval(() => setTick((tick) => tick + 1), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const visiblePlants = plants.filter((p) => !p.deleted);

  useEffect(() => {
    if (!loaded) return;
    savePlants(plants);
    rescheduleAll(visiblePlants, language, soundEnabled);
  }, [plants, loaded, language, soundEnabled]);

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    setSoundEnabled(enabled);
    saveSoundEnabled(enabled);
  };

  const handleAdd = (
    name: string,
    intervalDays: number,
    daysSinceWatered: number,
    photoUri: string | undefined,
    notes: string | undefined,
  ) => {
    const lastWatered = new Date(today());
    lastWatered.setDate(lastWatered.getDate() - daysSinceWatered);
    setPlants((prev) => [
      ...prev,
      { id: generatePlantId(), name, intervalDays, lastWatered: formatDate(lastWatered), updatedAt: nowMs(), photoUri, notes },
    ]);
    setFormVisible(false);
  };

  const handleEditSave = (
    name: string,
    intervalDays: number,
    daysSinceWatered: number,
    photoUri: string | undefined,
    notes: string | undefined,
  ) => {
    const oldPhotoUri = editingPlant!.photoUri;
    if (oldPhotoUri && oldPhotoUri !== photoUri) {
      deletePhotoFile(oldPhotoUri);
    }
    const lastWatered = new Date(today());
    lastWatered.setDate(lastWatered.getDate() - daysSinceWatered);
    setPlants((prev) =>
      prev.map((p) =>
        p.id === editingPlant!.id
          ? { ...p, name, intervalDays, lastWatered: formatDate(lastWatered), updatedAt: nowMs(), photoUri, notes }
          : p,
      ),
    );
    setEditingPlant(null);
  };

  const handleWater = (plant: Plant) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === plant.id
          ? { ...p, lastWatered: formatDate(today()), lastNotifiedDate: undefined, updatedAt: nowMs() }
          : p,
      ),
    );
  };

  const handleDeleteConfirmed = () => {
    setPlants((prev) =>
      prev.map((p) => (p.id === deletingPlant!.id ? { ...p, deleted: true, updatedAt: nowMs() } : p)),
    );
    setDeletingPlant(null);
  };

  const handleWaterPress = (plant: Plant) => {
    if (isWaterable(plant)) {
      handleWater(plant);
    } else {
      setEarlyWaterPlant(plant);
    }
  };

  const handleEarlyWaterConfirmed = () => {
    handleWater(earlyWaterPlant!);
    setEarlyWaterPlant(null);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌱 {t('app_title')}</Text>
        <Pressable hitSlop={8} onPress={() => setSettingsVisible(true)}>
          <Text style={styles.headerAction}>⚙</Text>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={visiblePlants}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PlantRow
            plant={item}
            onWater={() => handleWaterPress(item)}
            onEdit={() => setEditingPlant(item)}
            onDelete={() => setDeletingPlant(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('empty_list')}</Text>}
      />

      <Pressable style={styles.fab} onPress={() => setFormVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <PlantFormModal
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        onSave={handleAdd}
      />

      <PlantFormModal
        visible={editingPlant !== null}
        initialName={editingPlant?.name}
        initialInterval={editingPlant?.intervalDays}
        initialLastWatered={editingPlant?.lastWatered}
        initialPhotoUri={editingPlant?.photoUri}
        initialNotes={editingPlant?.notes}
        onCancel={() => setEditingPlant(null)}
        onSave={handleEditSave}
      />

      <ConfirmModal
        visible={deletingPlant !== null}
        message={deletingPlant ? t('delete_confirm_message', deletingPlant.name) : ''}
        onCancel={() => setDeletingPlant(null)}
        onConfirm={handleDeleteConfirmed}
      />

      <ConfirmModal
        visible={earlyWaterPlant !== null}
        message={
          earlyWaterPlant
            ? t('water_early_message', earlyWaterPlant.name, formatDays(daysLeft(earlyWaterPlant), language))
            : ''
        }
        confirmLabel={t('water_button')}
        onCancel={() => setEarlyWaterPlant(null)}
        onConfirm={handleEarlyWaterConfirmed}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onOpenSync={() => setSyncSettingsVisible(true)}
        onOpenBackup={() => setBackupVisible(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <SyncSettingsModal
        visible={syncSettingsVisible}
        onClose={() => setSyncSettingsVisible(false)}
        onSynced={(synced) => setPlants(synced)}
      />

      <BackupModal
        visible={backupVisible}
        plants={plants}
        onClose={() => setBackupVisible(false)}
        onImported={(imported) => setPlants(imported)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  headerAction: {
    color: theme.textSecondary,
    fontSize: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  empty: {
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
  },
});
