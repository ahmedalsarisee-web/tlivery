import type {
  FirestoreDataConverter,
  WithFieldValue,
} from 'firebase/firestore';
import type {UserProfile} from '@app/models/user-profile.model';
import type {UserDocument} from '../documents/user.document';
import {
  fromFirestoreTimestamp,
  toFirestoreTimestamp,
} from '../firestoreTimestamp';

export const userProfileConverter: FirestoreDataConverter<
  UserProfile,
  UserDocument
> = {
  toFirestore(model) {
    const user = model as UserProfile;
    return {
      displayName: user.displayName,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      altPhoneNumber: user.altPhoneNumber,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
      permissions: user.permissions ?? [],
      profileComplete: user.profileComplete,
      defaultLocation: user.defaultLocation,
      createdAt: toFirestoreTimestamp(user.createdAt),
      updatedAt: toFirestoreTimestamp(user.updatedAt),
      lastLoginAt: user.lastLoginAt
        ? toFirestoreTimestamp(user.lastLoginAt)
        : null,
    } as WithFieldValue<UserDocument>;
  },

  fromFirestore(snapshot) {
    const data = snapshot.data() as UserDocument;
    const fullName =
      typeof data.fullName === 'string' && data.fullName.trim()
        ? data.fullName.trim()
        : null;
    return {
      id: snapshot.id,
      displayName: data.displayName,
      fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      altPhoneNumber:
        typeof data.altPhoneNumber === 'string' ? data.altPhoneNumber : null,
      role: data.role,
      status: data.status,
      companyId: data.companyId,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      profileComplete: data.profileComplete === true,
      defaultLocation: data.defaultLocation ?? null,
      createdAt: fromFirestoreTimestamp(data.createdAt, 'users.createdAt'),
      updatedAt: fromFirestoreTimestamp(data.updatedAt, 'users.updatedAt'),
      lastLoginAt: data.lastLoginAt
        ? fromFirestoreTimestamp(data.lastLoginAt, 'users.lastLoginAt')
        : null,
    };
  },
};
