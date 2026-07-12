import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { loadSyncSettings, saveSyncSettings, SyncSettings } from '../storage';
import { testConnection } from '../sync';
import { performSync, SyncOutcome } from '../backgroundSync';
import { Plant } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSynced: (plants: Plant[]) => void;
}

function describeOutcome(outcome: SyncOutcome): string {
  switch (outcome.status) {
    case 'synced':
      return 'Синхронизировано успешно.';
    case 'unreachable':
      return 'Не удалось подключиться к десктопу. Убедитесь, что оба устройства в одной Wi-Fi сети.';
    case 'not-configured':
      return 'Сначала укажите и сохраните адрес десктопа.';
    case 'skipped-too-soon':
      return 'Уже синхронизировали недавно.';
  }
}

function formatLastSync(lastSyncAt: number | null): string {
  if (!lastSyncAt) return 'ещё не выполнялась';
  return new Date(lastSyncAt).toLocaleString();
}

export function SyncSettingsModal({ visible, onClose, onSynced }: Props) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('8787');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const settings = await loadSyncSettings();
      setHost(settings.host ?? '');
      setPort(String(settings.port));
      setLastSyncAt(settings.lastSyncAt);
      setStatusMessage('');
    })();
  }, [visible]);

  const currentSettings = (): SyncSettings => ({
    host: host.trim() || null,
    port: parseInt(port.trim(), 10) || 8787,
    lastSyncAt,
  });

  const handleSave = async () => {
    await saveSyncSettings(currentSettings());
    setStatusMessage('Адрес сохранён.');
  };

  const handleTest = async () => {
    const settings = currentSettings();
    if (!settings.host) {
      setStatusMessage('Введите IP-адрес десктопа.');
      return;
    }
    setBusy(true);
    setStatusMessage('Проверяем соединение…');
    const ok = await testConnection(settings.host, settings.port);
    setStatusMessage(ok ? 'Десктоп найден ✓' : 'Не отвечает. Проверьте адрес и сеть.');
    setBusy(false);
  };

  const handleSyncNow = async () => {
    await saveSyncSettings(currentSettings());
    setBusy(true);
    setStatusMessage('Синхронизация…');
    const outcome = await performSync(true);
    setStatusMessage(describeOutcome(outcome));
    if (outcome.status === 'synced' && outcome.plants) {
      setLastSyncAt(Date.now());
      onSynced(outcome.plants);
    }
    setBusy(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Синхронизация с десктопом</Text>

          <Text style={styles.label}>IP-адрес десктопа</Text>
          <TextInput
            style={styles.input}
            value={host}
            onChangeText={setHost}
            placeholder="Например, 192.168.1.23"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Порт</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            keyboardType="number-pad"
          />

          <Text style={styles.hint}>
            Адрес и порт показаны в настройках десктопного виджета. Синхронизация работает,
            только пока оба устройства в одной локальной сети; в фоне выполняется примерно раз в сутки.
          </Text>

          <Text style={styles.lastSync}>Последняя синхронизация: {formatLastSync(lastSyncAt)}</Text>

          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={handleTest} disabled={busy}>
              <Text style={styles.buttonText}>Проверить</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSyncNow} disabled={busy}>
              <Text style={styles.buttonText}>Синхронизировать сейчас</Text>
            </Pressable>
          </View>

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Закрыть</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Сохранить</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    backgroundColor: theme.panelBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  label: {
    color: theme.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    color: theme.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 15,
  },
  hint: {
    color: theme.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  lastSync: {
    color: theme.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  status: {
    color: theme.accent,
    fontSize: 13,
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: theme.textSecondary,
    fontSize: 13,
  },
});
