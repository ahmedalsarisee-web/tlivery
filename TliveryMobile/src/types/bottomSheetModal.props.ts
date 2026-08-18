import type {ReactNode} from 'react';

export type BottomSheetHeaderSurface = 'glass' | 'sheet';

export type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerTrailing?: ReactNode;
  minHeight?: number;
  height?: number;
  children: ReactNode;
  detached?: boolean;
  showHeaderCloseButton?: boolean;
  headerSurface?: BottomSheetHeaderSurface;
};
