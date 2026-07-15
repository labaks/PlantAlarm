import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { Language, useLanguage } from '../i18n';
import { Select } from './Select';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenSync: () => void;
}

export function SettingsModal({ visible, onClose, onOpenSync }: Props) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('settings_title')}</Text>

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

          <Pressable style={styles.row} onPress={onOpenSync}>
            <Text style={styles.rowText}>{t('sync_title')}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </Pressable>

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>{t('close_button')}</Text>
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
  selectWrap: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  rowText: {
    color: theme.textPrimary,
    fontSize: 15,
  },
  rowChevron: {
    color: theme.textSecondary,
    fontSize: 18,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
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
