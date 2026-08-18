import {ThemeType} from '@app/theme/theme';
import {OrderStatus, WaselOrder} from '../types';

export const orderStatusColor = (
  theme: ThemeType,
  status: OrderStatus,
): string => {
  switch (status) {
    case 'draft':
      return theme.typography.caption;
    case 'pendingApproval':
    case 'returned':
      return theme.status.warning;
    case 'pendingCompany':
    case 'companyAccepted':
      return theme.status.info;
    case 'driverAssigned':
    case 'driverOnTheWay':
    case 'arrivedPickup':
      return '#6366F1';
    case 'pickedUp':
    case 'onRoute':
      return theme.secondary;
    case 'nearCustomer':
    case 'delivered':
    case 'completed':
      return theme.status.success;
    case 'cancelled':
    case 'failedDelivery':
      return theme.status.error;
    case 'refunded':
      return theme.typography.secondary;
    default:
      return theme.typography.secondary;
  }
};

export const MOCK_ORDERS: WaselOrder[] = [
  {
    id: 'ord_1001',
    reference: 'WSL-24017',
    customerName: 'Sara Al-Masri',
    customerPhone: '+962 79 123 4567',
    pickupAddress: 'Abdali Mall, Amman',
    dropoffAddress: 'Khalda, Amman',
    status: 'onRoute',
    companyName: 'Express Jo',
    driverName: 'Ahmad K.',
    amountJod: 2.75,
    isCod: true,
    createdAt: '2026-07-17T10:12:00',
    etaMinutes: 18,
    assignmentMode: 'ai',
    timeline: [
      {status: 'pendingApproval', at: '10:12'},
      {status: 'pendingCompany', at: '10:14'},
      {status: 'companyAccepted', at: '10:16'},
      {status: 'driverAssigned', at: '10:18'},
      {status: 'pickedUp', at: '10:31'},
      {status: 'onRoute', at: '10:33'},
    ],
  },
  {
    id: 'ord_1002',
    reference: 'WSL-24012',
    customerName: 'Omar Nasser',
    customerPhone: '+962 78 555 0190',
    pickupAddress: 'Sweifieh, Amman',
    dropoffAddress: 'Jubeiha, Amman',
    status: 'pendingCompany',
    amountJod: 3.1,
    isCod: false,
    createdAt: '2026-07-17T11:05:00',
    assignmentMode: 'manual',
    timeline: [
      {status: 'pendingApproval', at: '11:05'},
      {status: 'pendingCompany', at: '11:07'},
    ],
  },
  {
    id: 'ord_1003',
    reference: 'WSL-23988',
    customerName: 'Lina Haddad',
    customerPhone: '+962 77 400 2211',
    pickupAddress: 'Pharmacy One — Gardens',
    dropoffAddress: 'Dabouq, Amman',
    status: 'delivered',
    companyName: 'FastDrop',
    driverName: 'Rami S.',
    amountJod: 2.4,
    isCod: true,
    createdAt: '2026-07-16T16:40:00',
    assignmentMode: 'ai',
    timeline: [
      {status: 'pendingCompany', at: '16:41'},
      {status: 'driverAssigned', at: '16:50'},
      {status: 'pickedUp', at: '17:05'},
      {status: 'delivered', at: '17:28'},
      {status: 'completed', at: '17:30'},
    ],
  },
  {
    id: 'ord_1004',
    reference: 'WSL-23950',
    customerName: 'Yousef Saleh',
    customerPhone: '+962 79 888 1010',
    pickupAddress: 'Flower Corner — Rainbow St',
    dropoffAddress: 'Marj Al-Hamam',
    status: 'failedDelivery',
    companyName: 'CityGo',
    driverName: 'Hassan M.',
    amountJod: 3.5,
    isCod: true,
    createdAt: '2026-07-16T14:10:00',
    assignmentMode: 'manual',
    timeline: [
      {status: 'pickedUp', at: '14:40'},
      {status: 'onRoute', at: '14:42'},
      {status: 'failedDelivery', at: '15:20'},
    ],
  },
];

export const MOCK_COMPANY_QUOTES = [
  {
    id: 'co_express',
    name: 'Express Jo',
    nameAr: 'إكسبريس جو',
    etaMinutes: 35,
    costJod: 2.75,
    rating: 4.8,
    distanceKm: 3.2,
    slaLabel: '45m SLA',
  },
  {
    id: 'co_fastdrop',
    name: 'FastDrop',
    nameAr: 'فاست دروب',
    etaMinutes: 42,
    costJod: 2.4,
    rating: 4.5,
    distanceKm: 5.1,
    slaLabel: '60m SLA',
  },
  {
    id: 'co_citygo',
    name: 'CityGo',
    nameAr: 'سيتي جو',
    etaMinutes: 28,
    costJod: 3.1,
    rating: 4.6,
    distanceKm: 2.4,
    slaLabel: '40m SLA',
  },
];
