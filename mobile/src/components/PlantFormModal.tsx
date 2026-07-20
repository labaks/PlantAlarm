import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { daysBetween, parseDate, today } from '../types';
import { useLanguage } from '../i18n';
import { PhotoPicker } from './PhotoPicker';

interface Props {
  visible: boolean;
  initialName?: string;
  initialInterval?: number;
  initialLastWatered?: string;
  initialPhotoUri?: string;
  onCancel: () => void;
  onSave: (name: string, intervalDays: number, daysSinceWatered: number, photoUri: string | undefined) => void;
}

export function PlantFormModal({
  visible,
  initialName,
  initialInterval,
  initialLastWatered,
  initialPhotoUri,
  onCancel,
  onSave,
}: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialName ?? '');
  const [interval, setInterval] = useState(String(initialInterval ?? 7));
  const [daysAgo, setDaysAgo] = useState('0');
  const [photoUri, setPhotoUri] = useState<string | undefined>(initialPhotoUri);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setInterval(String(initialInterval ?? 7));
      setDaysAgo(String(initialLastWatered ? daysBetween(parseDate(initialLastWatered), today()) : 0));
      setPhotoUri(initialPhotoUri);
      setError('');
    }
  }, [visible, initialName, initialInterval, initialLastWatered, initialPhotoUri]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('err_name_required'));
      return;
    }
    const days = parseInt(interval.trim(), 10);
    if (!Number.isFinite(days) || days <= 0) {
      setError(t('err_interval_invalid'));
      return;
    }
    const daysAgoNum = parseInt(daysAgo.trim(), 10);
    if (!Number.isFinite(daysAgoNum) || daysAgoNum < 0) {
      setError(t('err_days_ago_invalid'));
      return;
    }
    onSave(trimmedName, days, daysAgoNum, photoUri);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{initialName ? t('edit_title') : t('add_title')}</Text>

          <PhotoPicker photoUri={photoUri} onChange={setPhotoUri} />

          <Text style={styles.label}>{t('name_label')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('name_placeholder')}
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>{t('interval_label')}</Text>
          <TextInput
            style={styles.input}
            value={interval}
            onChangeText={setInterval}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>{t('days_ago_label')}</Text>
          <TextInput
            style={styles.input}
            value={daysAgo}
            onChangeText={setDaysAgo}
            keyboardType="number-pad"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>{t('cancel_button')}</Text>
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
  error: {
    color: theme.danger,
    fontSize: 13,
    marginBottom: 10,
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
