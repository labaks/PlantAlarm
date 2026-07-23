import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { useLanguage } from '../i18n';
import { exportBackup, importBackup } from '../backup';
import { ConfirmModal } from './ConfirmModal';
import { Plant } from '../types';

interface Props {
  visible: boolean;
  plants: Plant[];
  onClose: () => void;
  onImported: (plants: Plant[]) => void;
}

export function BackupModal({ visible, plants, onClose, onImported }: Props) {
  const { t } = useLanguage();
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<Plant[] | null>(null);

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportBackup(plants);
      setStatusMessage(t('export_success'));
    } catch (err) {
      console.warn('[backup] export failed', err);
      setStatusMessage(t('export_error'));
    }
    setBusy(false);
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const imported = await importBackup();
      if (imported) setPendingImport(imported);
    } catch (err) {
      console.warn('[backup] import failed', err);
      setStatusMessage(t('import_error'));
    }
    setBusy(false);
  };

  const handleConfirmImport = () => {
    onImported(pendingImport!);
    setPendingImport(null);
    setStatusMessage(t('import_success'));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('backup_title')}</Text>

          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={handleExport} disabled={busy}>
              <Text style={styles.buttonText}>{t('export_button')}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleImport} disabled={busy}>
              <Text style={styles.buttonText}>{t('import_button')}</Text>
            </Pressable>
          </View>

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>{t('close_button')}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ConfirmModal
        visible={pendingImport !== null}
        message={t('import_confirm_message')}
        confirmLabel={t('import_confirm_button')}
        onCancel={() => setPendingImport(null)}
        onConfirm={handleConfirmImport}
      />
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
