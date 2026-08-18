import {ToastType} from '../enums/ToastType';
import type {ToastProps} from '../types/toast.props';

export const TOAST_VISIBILITY_MS = 5000;

export const getAccentCssVar = (type: ToastProps['type']): string => {
  switch (type) {
    case ToastType.success:
      return 'var(--success)';
    case ToastType.info:
      return 'var(--info)';
    case ToastType.error:
      return 'var(--error)';
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
