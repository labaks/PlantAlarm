import React, { useRef } from 'react';
import { Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Plant, fillFraction, statusColor, statusText } from '../types';
import { theme } from '../theme';
import { useLanguage } from '../i18n';
import { DropletIcon } from './DropletIcon';

interface Props {
  plant: Plant;
  onWater: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Long-press-and-drag reordering, via the "⠿" handle. All three fire only when the handle is used. */
  onDragStart?: () => void;
  onDragMove?: (dy: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  /** Sub-slot offset (px) to keep the row tracking under the finger between index swaps. */
  dragOffsetY?: number;
  onRowHeight?: (height: number) => void;
}

export function PlantRow({
  plant,
  onWater,
  onEdit,
  onDelete,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,
  dragOffsetY,
  onRowHeight,
}: Props) {
  const { language } = useLanguage();

  // PanResponder.create is only called once (via useRef below), so its callbacks must read
  // props through a ref that's kept current every render — otherwise they close over whatever
  // onDragStart/onDragMove/onDragEnd were on the row's first render and never see updates again.
  const dragCallbacks = useRef({ onDragStart, onDragMove, onDragEnd });
  dragCallbacks.current = { onDragStart, onDragMove, onDragEnd };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => dragCallbacks.current.onDragStart?.(),
      onPanResponderMove: (_evt, gestureState) => dragCallbacks.current.onDragMove?.(gestureState.dy),
      onPanResponderRelease: () => dragCallbacks.current.onDragEnd?.(),
      onPanResponderTerminate: () => dragCallbacks.current.onDragEnd?.(),
    }),
  ).current;

  return (
    <View
      onLayout={(e) => onRowHeight?.(e.nativeEvent.layout.height)}
      style={[
        styles.card,
        isDragging && styles.cardDragging,
        isDragging && { transform: [{ translateY: dragOffsetY ?? 0 }], zIndex: 10, elevation: 6 },
      ]}
    >
      <View style={styles.photoCircle}>
        {plant.photoUri ? (
          <Image source={{ uri: plant.photoUri }} style={styles.photoImage} />
        ) : (
          <Text style={styles.photoPlaceholder}>🌱</Text>
        )}
      </View>

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

      <View {...panResponder.panHandlers} hitSlop={8} style={styles.dragHandle}>
        <Text style={styles.iconGlyph}>⠿</Text>
      </View>
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
  cardDragging: {
    opacity: 0.6,
  },
  dragHandle: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  photoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    fontSize: 14,
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
