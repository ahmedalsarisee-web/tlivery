import {useMemo, FC} from 'react';
import Toast from 'react-native-toast-message';
import toastConfig from '@app/utils/toastConfig';

const ToastHost: FC = () => {
  const config = useMemo(() => toastConfig(), []);

  return <Toast config={config} topOffset={50} visibilityTime={5000} autoHide />;
};

export default ToastHost;
