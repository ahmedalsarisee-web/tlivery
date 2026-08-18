import Toast from '@app/components/toast';
import {ToastType} from '@app/enums/ToastType';
import {ToastRenderProps} from '@app/types/toast.props';

const renderToast =
  (type: ToastType.success | ToastType.error | ToastType.info) =>
  ({text1, isVisible, hide}: ToastRenderProps) =>
    (
      <Toast
        text={text1 ?? ''}
        type={type}
        isVisible={isVisible}
        hide={hide}
      />
    );

const toastConfig = () => ({
  success: renderToast(ToastType.success),
  error: renderToast(ToastType.error),
  info: renderToast(ToastType.info),
});

export default toastConfig;
