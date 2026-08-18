import type {FC} from 'react';
import IssuedAccountsListScreen from './IssuedAccountsListScreen';

const CustomerAccountsScreen: FC = () => (
  <IssuedAccountsListScreen kind="client" />
);

export default CustomerAccountsScreen;
