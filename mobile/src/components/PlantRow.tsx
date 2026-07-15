import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plant, fillFraction, statusColor, statusText } from '../types';
import { theme } from '../theme';
import { useLanguage } from '../i18n';
import { DropletIcon } from './DropletIcon';

interface Props {
  plant: Plant;
  onWater: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlantRow({ plant, onWater, onEdit, onDelete }: Props) {
  const { language } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{plant.name}</Text>
        <Text style={[styles.status, { color: statusColor(plant) }]}>{statusText(plant, language)}</Text>
      </View>

      <Pressable onPress={onWater} hitSlop={8} style={styles.iconButton}>
        <DropletIcon size={18} fraction={fillFraction(plant)} color={theme.water} />
      </Pressable>

      <Pressable onPress={onEdit} hitSlop={8} style={styles.iconButton}>
        <Text style={styles.iconGlyph}>✎</Text>
      </Pressable>

      <Pressable onPress={onDelete} hitSlop={8} style={styles.iconButton}>
        <Text style={styles.iconGlyph}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  iconGlyph: {
    color: theme.textSecondary,
    fontSize: 18,
  },
});
