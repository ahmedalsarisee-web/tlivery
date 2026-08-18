export type DriverStatus = 'active' | 'offline' | 'busy' | 'suspended';

export type VehicleType = 'motorcycle' | 'car' | 'van';

export type CompanyProfile = {
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
  status: 'active' | 'suspended' | 'pending';
  notes: string;
};

export type CompanyDriver = {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber: string;
  status: DriverStatus;
  activeOrders: number;
  rating: number;
  joinedAt: string;
};

export type AddDriverInput = {
  fullName: string;
  phone: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber: string;
};
