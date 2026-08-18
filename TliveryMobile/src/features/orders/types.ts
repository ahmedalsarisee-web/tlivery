export type OrderStatus =
  | 'draft'
  | 'pendingApproval'
  | 'pendingCompany'
  | 'companyAccepted'
  | 'driverAssigned'
  | 'shipped'
  | 'driverOnTheWay'
  | 'arrivedPickup'
  | 'pickedUp'
  | 'onRoute'
  | 'nearCustomer'
  | 'delivered'
  | 'returned'
  | 'cancelled'
  | 'failedDelivery'
  | 'refunded'
  | 'completed';

export type AssignmentMode = 'manual' | 'ai';

export interface DeliveryCompanyQuote {
  id: string;
  name: string;
  nameAr: string;
  etaMinutes: number;
  costJod: number;
  rating: number;
  distanceKm: number;
  slaLabel: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  at: string;
  noteKey?: string;
}

export interface WaselOrder {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLocation?: import('@app/constants/jordanLocations').PublicOrderLocation | null;
  dropoffLocation?: import('@app/constants/jordanLocations').PublicOrderLocation | null;
  status: OrderStatus;
  companyId?: string;
  companyName?: string;
  companyCode?: string;
  clientId?: string | null;
  createdByUserId?: string;
  createdByRole?: string;
  createdByName?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  amountJod: number;
  isCod: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  etaMinutes?: number;
  assignmentMode?: AssignmentMode;
  timeline: OrderTimelineEvent[];
}

export interface CreateOrderInput {
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupLocation?: import('@app/constants/jordanLocations').PublicOrderLocation | null;
  dropoffLocation?: import('@app/constants/jordanLocations').PublicOrderLocation | null;
  amountJod?: number;
  isCod?: boolean;
  notes?: string;
}
