import {getDownloadURL, ref, uploadBytes} from 'firebase/storage';
import {firebaseStorage} from '../firebase/firebaseApp';
import type {DriverImageKind} from '../utils/compressDriverImage';

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
  blob: Blob;
}): Promise<string> {
  const path = driverMediaPath(
    params.companyId,
    params.driverId,
    params.kind,
  );
  const storageRef = ref(firebaseStorage, path);
  await uploadBytes(storageRef, params.blob, {
    contentType: 'image/jpeg',
    cacheControl: 'public,max-age=31536000',
  });
  return getDownloadURL(storageRef);
}
