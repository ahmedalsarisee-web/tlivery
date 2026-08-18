import {type FC, useEffect} from 'react';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {selectUserRole, useUserStore} from '@app/features/user';
import type {RootStackParamList} from '@app/types/navigation';
import LiveTrackingScreen from './LiveTrackingScreen';

type ScreenRoute = RouteProp<RootStackParamList, 'LiveTracking'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * LiveTracking route entry:
 * - Company / client / merchant → watch-only in-app map
 * - Driver → no in-app map (device maps from Order Details); bounce back
 */
const LiveTrackingGate: FC = () => {
  const role = useUserStore(selectUserRole);
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();

  useEffect(() => {
    if (role !== 'driver') {
      return;
    }
    navigation.replace('OrderDetails', {orderId: route.params.orderId});
  }, [role, navigation, route.params.orderId]);

  if (role === 'driver') {
    return null;
  }
  return <LiveTrackingScreen />;
};

export default LiveTrackingGate;
