export type CompanyStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface CompanyLocation {
  latitude: number;
  longitude: number;
}

export interface CompanyAddress {
  city: string;
  area: string | null;
  street: string | null;
  details: string;
  location: CompanyLocation | null;
}

export interface CompanyContact {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  legalName: string;
  commercialRegistrationNumber: string;
  address: CompanyAddress;
  contact: CompanyContact;
  maxDrivers: number;
  status: CompanyStatus;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}
