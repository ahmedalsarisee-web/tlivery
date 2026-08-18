import {FC, useEffect, useRef} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {useTranslation} from 'react-i18next';
import {ToastType} from '@app/enums/ToastType';
import {showToast} from '@app/utils/showToast';

const NetworkToastListener: FC = () => {
  const {t} = useTranslation();
  const previousStatusRef = useRef<boolean | null>(null);

  useEffect(() => {
    const handleNetworkChange = async () => {
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected ?? false;

      if (previousStatusRef.current === null) {
        previousStatusRef.current = isOnline;
        if (!isOnline) {
          showToast(ToastType.error, t('noInternetConnection'));
        }
        return;
      }

      if (previousStatusRef.current !== isOnline) {
        showToast(
          isOnline ? ToastType.success : ToastType.error,
          isOnline ? t('backOnline') : t('noInternetConnection'),
        );
        previousStatusRef.current = isOnline;
      }
    };

    void handleNetworkChange();
    const unsubscribe = NetInfo.addEventListener(() => {
      void handleNetworkChange();
    });
    return unsubscribe;
  }, [t]);

  return null;
};

export default NetworkToastListener;
