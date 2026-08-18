import type {
  FirestoreDataConverter,
  WithFieldValue,
} from 'firebase/firestore';
import type {Company} from '@app/models/company.model';
import type {CompanyDocument} from '../documents/company.document';
import {
  fromFirestoreTimestamp,
  toFirestoreTimestamp,
} from '../firestoreTimestamp';

export const companyConverter: FirestoreDataConverter<
  Company,
  CompanyDocument
> = {
  toFirestore(model) {
    const company = model as Company;
    return {
      code: company.code,
      name: company.name,
      legalName: company.legalName,
      commercialRegistrationNumber: company.commercialRegistrationNumber,
      address: company.address,
      contact: company.contact,
      maxDrivers: company.maxDrivers,
      status: company.status,
      createdByUserId: company.createdByUserId,
      createdAt: toFirestoreTimestamp(company.createdAt),
      updatedAt: toFirestoreTimestamp(company.updatedAt),
    } as WithFieldValue<CompanyDocument>;
  },

  fromFirestore(snapshot) {
    const data = snapshot.data() as CompanyDocument;
    return {
      id: snapshot.id,
      code: data.code,
      name: data.name,
      legalName: data.legalName,
      commercialRegistrationNumber: data.commercialRegistrationNumber,
      address: data.address,
      contact: data.contact,
      maxDrivers: data.maxDrivers,
      status: data.status,
      createdByUserId: data.createdByUserId,
      createdAt: fromFirestoreTimestamp(
        data.createdAt,
        'companies.createdAt',
      ),
      updatedAt: fromFirestoreTimestamp(
        data.updatedAt,
        'companies.updatedAt',
      ),
    };
  },
};
