import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export type DriverImageKind =
  | 'avatar'
  | 'license'
  | 'registration'
  | 'insurance';

type CompressPreset = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

const PRESETS: Record<DriverImageKind, CompressPreset> = {
  avatar: {maxWidth: 512, maxHeight: 512, quality: 0.65},
  license: {maxWidth: 1280, maxHeight: 1280, quality: 0.55},
  registration: {maxWidth: 1280, maxHeight: 1280, quality: 0.55},
  insurance: {maxWidth: 1280, maxHeight: 1280, quality: 0.55},
};

export type PickedImage = {
  uri: string;
  fileName: string;
  type: string;
  fileSize?: number;
};

export async function pickCompressedDriverImage(
  kind: DriverImageKind,
  source: 'library' | 'camera' = 'library',
): Promise<PickedImage | null> {
  const preset = PRESETS[kind];
  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: preset.quality,
  };

  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== 'granted') {
    return null;
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{resize: {width: preset.maxWidth}}],
    {
      compress: preset.quality,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: manipulated.uri,
    fileName: `photo_${Date.now()}.jpg`,
    type: 'image/jpeg',
    fileSize: result.assets[0].fileSize,
  };
}
