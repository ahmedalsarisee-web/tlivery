export type DriverImageKind =
  | 'avatar'
  | 'license'
  | 'registration'
  | 'insurance';

type CompressPreset = {
  maxWidth: number;
  quality: number;
};

const PRESETS: Record<DriverImageKind, CompressPreset> = {
  avatar: {maxWidth: 512, quality: 0.65},
  license: {maxWidth: 1280, quality: 0.55},
  registration: {maxWidth: 1280, quality: 0.55},
  insurance: {maxWidth: 1280, quality: 0.55},
};

/**
 * Resize + JPEG-compress a browser File via canvas so uploads stay small.
 */
export async function compressDriverImageFile(
  file: File,
  kind: DriverImageKind,
): Promise<Blob> {
  const preset = PRESETS[kind];
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, preset.maxWidth / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('canvas-unavailable');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      result => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('compress-failed'));
        }
      },
      'image/jpeg',
      preset.quality,
    );
  });
  return blob;
}
