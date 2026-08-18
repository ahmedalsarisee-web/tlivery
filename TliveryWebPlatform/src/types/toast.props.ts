import type {ToastType} from '../enums/ToastType';

export interface ToastProps {
  text: string;
  type: ToastType;
  isVisible?: boolean;
  onHide?: () => void;
}

export type ToastRenderProps = {
  text1?: string;
  isVisible?: boolean;
  hide?: () => void;
};
