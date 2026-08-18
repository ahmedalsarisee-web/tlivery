import {ThemeType} from '@app/theme/theme';
import {ToastType} from '@app/enums/ToastType';
import {ToastProps} from '@app/types/toast.props';

export const TOAST_VISIBILITY_MS = 5000;

export const getAccentColor = (
  type: ToastProps['type'],
  theme: ThemeType,
): string => {
  switch (type) {
    case ToastType.success:
      return theme.status.success;
    case ToastType.info:
      return theme.status.info;
    case ToastType.error:
      return theme.status.error;
  }
};

export const getToastIcon = (type: ToastProps['type']): string => {
  switch (type) {
    case ToastType.success:
      return '✔️';
    case ToastType.info:
      return 'ℹ️';
    case ToastType.error:
      return '❌';
  }
};
