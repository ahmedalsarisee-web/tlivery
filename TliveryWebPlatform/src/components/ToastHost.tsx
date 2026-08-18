import {useEffect, useMemo, useSyncExternalStore, type FC} from 'react';
import Toast from './Toast';
import toastConfig from '../utils/toastConfig';
import {
  getActiveToast,
  hideToast,
  subscribeToast,
} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {TOAST_VISIBILITY_MS} from '../utils/toastUtils';

const ToastHost: FC = () => {
  const config = useMemo(() => toastConfig(), []);
  const active = useSyncExternalStore(
    subscribeToast,
    getActiveToast,
    getActiveToast,
  );

  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = window.setTimeout(
      hideToast,
      active.visibilityTime ?? TOAST_VISIBILITY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active) {
    return null;
  }

  const type = active.type in config ? active.type : ToastType.info;

  const rendered = config[type].render({
    text1: active.text,
    isVisible: true,
    hide: hideToast,
  });

  return (
    <Toast
      key={active.id}
      text={rendered.text}
      type={rendered.type}
      isVisible={rendered.isVisible}
    />
  );
};

export default ToastHost;
