import Toast from 'react-native-toast-message';
import {ToastType} from '@app/enums/ToastType';

export const showToast = (
  type: ToastType,
  text1: string,
  visibilityTime = 5000,
): void => {
  Toast.show({
    type,
    text1,
    position: 'top',
    autoHide: true,
    visibilityTime,
  });
};
