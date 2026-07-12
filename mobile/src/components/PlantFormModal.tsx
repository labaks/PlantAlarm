import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';

interface Props {
  visible: boolean;
  initialName?: string;
  initialInterval?: number;
  onCancel: () => void;
  onSave: (name: string, intervalDays: number, daysSinceWatered: number) => void;
}

export function PlantFormModal({ visible, initialName, initialInterval, onCancel, onSave }: Props) {
  const isNewPlant = !initialName;
  const [name, setName] = useState(initialName ?? '');
  const [interval, setInterval] = useState(String(initialInterval ?? 7));
  const [daysAgo, setDaysAgo] = useState('0');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setInterval(String(initialInterval ?? 7));
      setDaysAgo('0');
      setError('');
    }
  }, [visible, initialName, initialInterval]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Введите название растения.');
      return;
    }
    const days = parseInt(interval.trim(), 10);
    if (!Number.isFinite(days) || days <= 0) {
      setError('Интервал должен быть положительным числом дней.');
      return;
    }
    const daysAgoNum = parseInt(daysAgo.trim(), 10);
    if (!Number.isFinite(daysAgoNum) || daysAgoNum < 0) {
      setError('Дней с последнего полива — число 0 или больше.');
      return;
    }
    onSave(trimmedName, days, daysAgoNum);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{initialName ? 'Редактировать цветок' : 'Новый цветок'}</Text>

          <Text style={styles.label}>Название</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Например, Фикус"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={styles.label}>Поливать раз в (дней)</Text>
          <TextInput
            style={styles.input}
            value={interval}
            onChangeText={setInterval}
            keyboardType="number-pad"
          />

          {isNewPlant && (
            <>
              <Text style={styles.label}>Дней с последнего полива</Text>
              <TextInput
                style={styles.input}
                value={daysAgo}
                onChangeText={setDaysAgo}
                keyboardType="number-pad"
              />
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.buttons}>
            <Pressable style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>Отмена</Text>
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
