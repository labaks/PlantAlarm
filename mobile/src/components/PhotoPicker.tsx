import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { useLanguage } from '../i18n';
import { savePhotoLocally } from '../photos';

interface Props {
  photoUri?: string;
  onChange: (uri: string | undefined) => void;
}

export function PhotoPicker({ photoUri, onChange }: Props) {
  const { t } = useLanguage();

  const handlePick = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('photo_permission_denied'));
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.[0]) return;
    const saved = await savePhotoLocally(result.assets[0].uri);
    onChange(saved);
  };

  return (
    <View style={styles.row}>
      <View style={styles.circle}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholder}>🌱</Text>
        )}
      </View>
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={() => handlePick(true)}>
          <Text style={styles.buttonText}>{t('photo_camera_button')}</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => handlePick(false)}>
          <Text style={styles.buttonText}>{t('photo_gallery_button')}</Text>
        </Pressable>
        {photoUri && (
          <Pressable style={styles.button} onPress={() => onChange(undefined)}>
            <Text style={styles.buttonText}>{t('photo_remove_button')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const CIRCLE_SIZE = 48;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    fontSize: 20,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  buttonText: {
    color: theme.textSecondary,
    fontSize: 12,
  },
});
