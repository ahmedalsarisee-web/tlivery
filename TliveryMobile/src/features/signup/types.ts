export type SignupRole = 'company' | 'driver' | 'customer';

export type VehicleType = 'motorcycle' | 'car' | 'van';

export type CompanySignupPayload = {
  companyName: string;
  commercialRegister: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  password: string;
};

export type DriverSignupPayload = {
  fullName: string;
  phone: string;
  vehicleType: VehicleType;
  plateNumber: string;
  licenseNumber: string;
  companyCode: string;
  password: string;
};
