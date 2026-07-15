import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { useLanguage } from '../i18n';

interface Props {
  visible: boolean;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ visible, message, confirmLabel, onCancel, onConfirm }: Props) {
  const { t } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('confirm_title')}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>{t('cancel_button')}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={onConfirm}>
              <Text style={styles.buttonText}>{confirmLabel ?? t('delete_button')}</Text>
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
    width: '85%',
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
    marginBottom: 10,
  },
  message: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
});
