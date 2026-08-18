import {Platform} from 'react-native';
import * as Location from 'expo-location';

export async function ensureLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === 'granted') {
      return true;
    }
    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.status === 'granted') {
      return true;
    }
    if (Platform.OS === 'ios' && requested.canAskAgain) {
      const retry = await Location.requestForegroundPermissionsAsync();
      return retry.status === 'granted';
    }
    return false;
  } catch {
    return false;
  }
}
