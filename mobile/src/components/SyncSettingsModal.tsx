import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { loadSyncSettings, saveSyncSettings, SyncSettings } from '../storage';
import { testConnection } from '../sync';
import { performSync, SyncOutcome } from '../backgroundSync';
import { Plant } from '../types';
import { Language, useLanguage } from '../i18n';
import { Select } from './Select';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSynced: (plants: Plant[]) => void;
}

function describeOutcome(outcome: SyncOutcome, t: (key: string) => string): string {
  switch (outcome.status) {
    case 'synced':
      return t('sync_status_synced');
    case 'unreachable':
      return t('sync_status_unreachable');
    case 'not-configured':
      return t('sync_status_not_configured');
    case 'skipped-too-soon':
      return t('sync_status_skipped');
  }
}

function formatLastSync(lastSyncAt: number | null, t: (key: string) => string): string {
  if (!lastSyncAt) return t('sync_never');
  return new Date(lastSyncAt).toLocaleString();
}

export function SyncSettingsModal({ visible, onClose, onSynced }: Props) {
  const { language, setLanguage, t } = useLanguage();
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
    setStatusMessage(t('sync_status_saved'));
  };

  const handleTest = async () => {
    const settings = currentSettings();
    if (!settings.host) {
      setStatusMessage(t('sync_status_enter_ip'));
      return;
    }
    setBusy(true);
    setStatusMessage(t('sync_status_testing'));
    const ok = await testConnection(settings.host, settings.port);
    setStatusMessage(ok ? t('sync_status_found') : t('sync_status_not_responding'));
    setBusy(false);
  };

  const handleSyncNow = async () => {
    await saveSyncSettings(currentSettings());
    setBusy(true);
    setStatusMessage(t('sync_syncing'));
    const outcome = await performSync(true);
    setStatusMessage(describeOutcome(outcome, t));
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
          <Text style={styles.title}>{t('sync_title')}</Text>

          <Text style={styles.label}>{t('language_label')}</Text>
          <View style={styles.selectWrap}>
            <Select
              value={language}
              options={[
                { label: 'Русский', value: 'ru' },
                { label: 'English', value: 'en' },
              ]}
              onChange={(lang) => setLanguage(lang as Language)}
            />
          </View>

          <Text style={styles.label}>{t('sync_host_label')}</Text>
          <TextInput
            style={styles.input}
            value={host}
            onChangeText={setHost}
            placeholder={t('sync_host_placeholder')}
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>{t('sync_port_label')}</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            keyboardType="number-pad"
          />

          <Text style={styles.hint}>{t('sync_hint')}</Text>

          <Text style={styles.lastSync}>{t('sync_last_label', formatLastSync(lastSyncAt, t))}</Text>

          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={handleTest} disabled={busy}>
              <Text style={styles.buttonText}>{t('sync_test_button')}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSyncNow} disabled={busy}>
              <Text style={styles.buttonText}>{t('sync_now_button')}</Text>
            </Pressable>
          </View>

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>{t('close_button')}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>{t('save_button')}</Text>
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
  selectWrap: {
    marginBottom: 12,
  },
});
