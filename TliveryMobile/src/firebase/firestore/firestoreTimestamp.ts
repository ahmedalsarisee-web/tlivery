import {Timestamp} from 'firebase/firestore';

type TimestampLike = {
  toDate: () => Date;
};

export const toFirestoreTimestamp = (value: Date): Timestamp =>
  Timestamp.fromDate(value);

export const fromFirestoreTimestamp = (
  value: unknown,
  fieldName: string,
): Date => {
  if (
    value == null ||
    typeof (value as TimestampLike).toDate !== 'function'
  ) {
    throw new Error(`Invalid Firestore timestamp: ${fieldName}`);
  }
  return (value as TimestampLike).toDate();
};
