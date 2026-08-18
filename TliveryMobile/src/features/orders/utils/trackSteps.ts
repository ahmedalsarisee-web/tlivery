import type {ImageSourcePropType} from 'react-native';
import Images from '@app/assets/Images';
import type {OrderStatus} from '@app/features/orders/types';

export type TrackStepId =
  | 'ordered'
  | 'shipped'
  | 'onTheWay'
  | 'arriving'
  | 'delivered';

export type TrackStep = {
  id: TrackStepId;
  labelKey: string;
  image: ImageSourcePropType;
};

/** Visual tracking steps shown on the horizontal timeline. */
export const TRACK_STEPS: TrackStep[] = [
  {
    id: 'ordered',
    labelKey: 'trackStepOrdered',
    image: Images.timeline.waiting,
  },
  {
    id: 'shipped',
    labelKey: 'trackStepShipped',
    image: Images.timeline.accepted,
  },
  {
    id: 'onTheWay',
    labelKey: 'trackStepOnTheWay',
    image: Images.timeline.onTheWay,
  },
  {
    id: 'arriving',
    labelKey: 'trackStepArriving',
    image: Images.timeline.arriving,
  },
  {
    id: 'delivered',
    labelKey: 'trackStepDelivered',
    image: Images.timeline.delivered,
  },
];

export const isTerminalNegative = (status: OrderStatus): boolean =>
  status === 'cancelled' ||
  status === 'failedDelivery' ||
  status === 'refunded' ||
  status === 'returned';

/** 0-based index into TRACK_STEPS for the current order status. */
export function trackStepIndex(status: OrderStatus): number {
  if (isTerminalNegative(status)) {
    return -1;
  }
  switch (status) {
    case 'delivered':
    case 'completed':
      return 4;
    case 'nearCustomer':
      return 3;
    case 'onRoute':
    case 'shipped':
    case 'driverOnTheWay':
    case 'arrivedPickup':
    case 'pickedUp':
      return 2;
    case 'driverAssigned':
      return 1;
    case 'companyAccepted':
    case 'pendingCompany':
    default:
      return 0;
  }
}
