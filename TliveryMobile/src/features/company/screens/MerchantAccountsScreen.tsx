import type {FC} from 'react';
import IssuedAccountsListScreen from './IssuedAccountsListScreen';

const MerchantAccountsScreen: FC = () => (
  <IssuedAccountsListScreen kind="merchant" />
);

export default MerchantAccountsScreen;
