import {ToastType} from '../enums/ToastType';
import type {ToastRenderProps} from '../types/toast.props';
import {getAccentCssVar, getToastIcon} from './toastUtils';

export type ToastConfigEntry = {
  type: ToastType;
  icon: string;
  accent: string;
  render: (props: ToastRenderProps) => {
    text: string;
    type: ToastType;
    isVisible: boolean;
    hide?: () => void;
  };
};

const entry = (type: ToastType): ToastConfigEntry => ({
  type,
  icon: getToastIcon(type),
  accent: getAccentCssVar(type),
  render: ({text1, isVisible, hide}) => ({
    text: text1 ?? '',
    type,
    isVisible: isVisible ?? true,
    hide,
  }),
});

/** Mirrors mobile `toastConfig` — typed success / error / info renderers. */
const toastConfig = () => ({
  success: entry(ToastType.success),
  error: entry(ToastType.error),
  info: entry(ToastType.info),
});

export default toastConfig;
