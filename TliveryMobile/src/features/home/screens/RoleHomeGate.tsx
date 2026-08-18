import {type FC} from 'react';
import {selectUserRole, useUserStore} from '@app/features/user';
import CompanyHomeScreen from './CompanyHomeScreen';
import CustomerHomeScreen from './CustomerHomeScreen';
import DriverHomeScreen from './DriverHomeScreen';
import HomeScreen from './HomeScreen';

/**
 * Home tab entry — role-specific dashboard wired to BE data.
 */
const RoleHomeGate: FC = () => {
  const role = useUserStore(selectUserRole);

  if (role === 'driver') {
    return <DriverHomeScreen />;
  }
  if (role === 'company_admin' || role === 'company_employee') {
    return <CompanyHomeScreen />;
  }
  if (role === 'client' || role === 'merchant') {
    return <CustomerHomeScreen />;
  }
  // super_admin / unknown — legacy dashboard
  return <HomeScreen />;
};

export default RoleHomeGate;
