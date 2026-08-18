import type {Timestamp} from 'firebase/firestore';
import type {
  CompanyAddress,
  CompanyContact,
  CompanyStatus,
} from '@app/models/company.model';

export interface CompanyDocument {
  code: string;
  name: string;
  legalName: string;
  commercialRegistrationNumber: string;
  address: CompanyAddress;
  contact: CompanyContact;
  maxDrivers: number;
  status: CompanyStatus;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
