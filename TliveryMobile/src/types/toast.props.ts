import {ToastType} from '@app/enums/ToastType';

export interface ToastProps {
  text: string;
  type: ToastType.success | ToastType.error | ToastType.info;
  isVisible?: boolean;
  hide?: () => void;
}

export type ToastRenderProps = {
  text1?: string;
  isVisible?: boolean;
  hide?: () => void;
};
