export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export type CompanyStatus = 'active' | 'suspended' | 'pending';

/** Company created / managed by Wasel super admin (mock). */
export type Company = {
  id: string;
  companyName: string;
  companyCode: string;
  commercialRegister: string;
  city: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  maxDrivers: number;
  activeDrivers: number;
  adminUsername: string;
  status: CompanyStatus;
  createdAt: string;
  notes: string;
};

/** @deprecated Prefer Company — kept for driver signup approval queue. */
export type CompanyApplication = Company;

export type DriverApplication = {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  plateNumber: string;
  licenseNumber: string;
  companyCode: string;
  status: RegistrationStatus;
  submittedAt: string;
};

export type AdminOrder = {
  id: string;
  customer: string;
  city: string;
  company: string;
  driver: string;
  status: string;
  amountJod: number;
};

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'CMP-104821',
    companyName: 'Express Jo',
    companyCode: 'EXPRESS',
    commercialRegister: 'CR-JOR-88421',
    city: 'Amman',
    address: 'Abdoun, Near 5th Circle',
    contactName: 'Sara Al-Masri',
    phone: '0791234567',
    email: 'ops@expressjo.jo',
    maxDrivers: 40,
    activeDrivers: 0,
    adminUsername: 'express.admin',
    status: 'pending',
    createdAt: '2026-07-18T09:12:00',
    notes: 'Awaiting documents verification',
  },
  {
    id: 'CMP-104790',
    companyName: 'CityGo Logistics',
    companyCode: 'CITYGO',
    commercialRegister: 'CR-JOR-77102',
    city: 'Irbid',
    address: 'University Street, Building 12',
    contactName: 'Hani Odeh',
    phone: '0787654321',
    email: 'hello@citygo.jo',
    maxDrivers: 25,
    activeDrivers: 12,
    adminUsername: 'citygo.admin',
    status: 'active',
    createdAt: '2026-07-16T14:40:00',
    notes: '',
  },
  {
    id: 'CMP-104755',
    companyName: 'FastDrop',
    companyCode: 'FASTDROP',
    commercialRegister: 'CR-JOR-55019',
    city: 'Zarqa',
    address: 'Free Zone Industrial Area',
    contactName: 'Lina Haddad',
    phone: '0771112233',
    email: 'team@fastdrop.jo',
    maxDrivers: 15,
    activeDrivers: 3,
    adminUsername: 'fastdrop.admin',
    status: 'suspended',
    createdAt: '2026-07-15T11:05:00',
    notes: 'Suspended — incomplete fleet insurance',
  },
];

export const MOCK_DRIVERS: DriverApplication[] = [
  {
    id: 'DRV-204331',
    fullName: 'Omar Yusuf',
    phone: '0795556677',
    vehicleType: 'motorcycle',
    plateNumber: '12-34567',
    licenseNumber: 'DL-998211',
    companyCode: 'EXPRESS',
    status: 'pending',
    submittedAt: '2026-07-18T10:02:00',
  },
  {
    id: 'DRV-204290',
    fullName: 'Rami Saleh',
    phone: '0782223344',
    vehicleType: 'van',
    plateNumber: '18-90211',
    licenseNumber: 'DL-441290',
    companyCode: '',
    status: 'pending',
    submittedAt: '2026-07-17T16:20:00',
  },
  {
    id: 'DRV-204201',
    fullName: 'Hassan M.',
    phone: '0778889900',
    vehicleType: 'car',
    plateNumber: '21-10045',
    licenseNumber: 'DL-220189',
    companyCode: 'CITYGO',
    status: 'approved',
    submittedAt: '2026-07-14T09:30:00',
  },
];

export const MOCK_ORDERS: AdminOrder[] = [
  {
    id: 'WSL-1042',
    customer: 'Nour A.',
    city: 'Abdoun',
    company: 'Aramex',
    driver: 'Omar Yusuf',
    status: 'In delivery',
    amountJod: 4.5,
  },
  {
    id: 'WSL-1038',
    customer: 'Khaled R.',
    city: '7th Circle',
    company: 'SMSA',
    driver: 'Rami Saleh',
    status: 'Delivered',
    amountJod: 3.2,
  },
  {
    id: 'WSL-1031',
    customer: 'Mona S.',
    city: 'Jubeiha',
    company: 'Go',
    driver: '—',
    status: 'Awaiting company',
    amountJod: 5.0,
  },
  {
    id: 'WSL-1029',
    customer: 'Fadi T.',
    city: 'Sweifieh',
    company: 'CityGo',
    driver: 'Hassan M.',
    status: 'Pickup',
    amountJod: 2.8,
  },
];

export const JORDAN_CITIES = [
  'Amman',
  'Irbid',
  'Zarqa',
  'Aqaba',
  'Madaba',
  'Salt',
  'Jerash',
  'Ajloun',
  'Karak',
  'Tafilah',
  'Mafraq',
  'Ma\'an',
] as const;

export type CreateCompanyInput = {
  companyName: string;
  companyCode: string;
  commercialRegister: string;
  city: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  maxDrivers: number;
  adminUsername: string;
  adminPassword: string;
  notes: string;
  activateNow: boolean;
};

export function createCompanyId(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `CMP-${n}`;
}

export function buildCompanyFromInput(input: CreateCompanyInput): Company {
  return {
    id: createCompanyId(),
    companyName: input.companyName.trim(),
    companyCode: input.companyCode.trim().toUpperCase(),
    commercialRegister: input.commercialRegister.trim(),
    city: input.city,
    address: input.address.trim(),
    contactName: input.contactName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    maxDrivers: input.maxDrivers,
    activeDrivers: 0,
    adminUsername: input.adminUsername.trim().toLowerCase(),
    status: input.activateNow ? 'active' : 'pending',
    createdAt: new Date().toISOString(),
    notes: input.notes.trim(),
  };
}
