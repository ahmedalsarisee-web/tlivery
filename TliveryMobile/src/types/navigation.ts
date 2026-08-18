import type {NavigatorScreenParams} from '@react-navigation/native';
import type {PublicOrderLocation} from '@app/constants/jordanLocations';

export type OrdersScreenParams = {
  initialStatus?: string;
};

export type MainTabParamList = {
  HomeTab: undefined;
  OrdersTab: OrdersScreenParams | undefined;
  DriversTab: undefined;
  MerchantsTab: undefined;
  EmployeesTab: undefined;
  MoreTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  SelectCountry: {mode?: 'firstRun' | 'change'} | undefined;
  Onboarding: undefined;
  Login: {method?: 'email' | 'phone'} | undefined;
  ForgotPassword: undefined;
  RegisterRole: undefined;
  RegisterCompany: undefined;
  RegisterDriverAccount: {inviteCode?: string} | undefined;
  RegisterDriver: {inviteCode?: string} | undefined;
  RegisterClientInvite:
    | {
        inviteCode?: string;
        defaultLocation?: PublicOrderLocation;
      }
    | undefined;
  RegisterPending: {role: 'company' | 'driver'; referenceId: string};
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Orders: OrdersScreenParams | undefined;
  CreateOrder:
    | {
        pickupLocation?: PublicOrderLocation;
        dropoffLocation?: PublicOrderLocation;
      }
    | undefined;
  CompleteClientProfile:
    | {
        defaultLocation?: PublicOrderLocation;
      }
    | undefined;
  MapLocationPicker: {
    kind: 'pickup' | 'dropoff' | 'profile';
    returnTo?:
      | 'CreateOrder'
      | 'CompleteClientProfile'
      | 'RegisterClientInvite';
    pickupLocation: PublicOrderLocation | null;
    dropoffLocation: PublicOrderLocation | null;
    profileLocation?: PublicOrderLocation | null;
  };
  OrderDetails: {orderId: string};
  ShipmentDetails: {orderId: string};
  OrderPlacerDetails: {
    userId: string;
    role: string;
    displayName?: string;
    companyId?: string;
    companyName?: string;
    accountId?: string;
  };
  LiveTracking: {orderId: string; driverId?: string};
  DriversMap: undefined;
  MyVehicle: undefined;
  EditMyVehicle: undefined;
  MyDocuments: undefined;
  AccountInfo: undefined;
  Notifications: undefined;
  CompanyDetails: undefined;
  AddDriver: undefined;
  DriverDetails: {driverId: string};
  AccountsHub: undefined;
  FinancePartyList: {kind: 'driver' | 'client'};
  FinanceLedger: {
    partyType: 'driver' | 'client';
    partyUserId: string;
    partyName?: string;
  };
  MerchantAccounts: undefined;
  CustomerAccounts: undefined;
  Reports: undefined;
  AddEmployee: undefined;
  AddMerchant: undefined;
  AddClient: undefined;
  AddIssuedAccount: undefined;
  IssuedAccountDetails: {
    accountId: string;
    kind: 'client' | 'merchant';
    displayName?: string;
  };
  EmployeeDetails: {employeeId: string};
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
