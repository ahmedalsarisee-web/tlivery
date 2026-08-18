export const ToastType = {
  success: 'success',
  error: 'error',
  info: 'info',
} as const;

export type ToastType = (typeof ToastType)[keyof typeof ToastType];
