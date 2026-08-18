import {getDownloadURL, ref, uploadBytes} from 'firebase/storage';
import {firebaseStorage} from '@app/firebase/firebaseApp';
import type {DriverImageKind} from '@app/utils/compressImage';

const fileLeaf = (kind: DriverImageKind): string => {
  switch (kind) {
    case 'avatar':
      return 'avatar.jpg';
    case 'license':
      return 'documents/license.jpg';
    case 'registration':
      return 'documents/registration.jpg';
    case 'insurance':
      return 'documents/insurance.jpg';
  }
};

export function driverMediaPath(
  companyId: string,
  driverId: string,
  kind: DriverImageKind,
): string {
  return `companies/${companyId}/drivers/${driverId}/${fileLeaf(kind)}`;
}

export async function uploadDriverImage(params: {
  companyId: string;
  driverId: string;
  kind: DriverImageKind;
  localUri: string;
  contentType?: string;
}): Promise<string> {
  const path = driverMediaPath(
    params.companyId,
    params.driverId,
    params.kind,
  );
  const response = await fetch(params.localUri);
  const blob = await response.blob();
  const storageRef = ref(firebaseStorage, path);
  await uploadBytes(storageRef, blob, {
    contentType: params.contentType ?? 'image/jpeg',
    cacheControl: 'public,max-age=31536000',
  });
  return getDownloadURL(storageRef);
}
