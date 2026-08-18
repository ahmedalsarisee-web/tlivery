import {ToastType} from '../enums/ToastType';
import {TOAST_VISIBILITY_MS} from './toastUtils';

export type ActiveToast = {
  id: number;
  type: ToastType;
  text: string;
  visibilityTime: number;
};

type Listener = () => void;

let nextId = 1;
let active: ActiveToast | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(listener => listener());
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveToast(): ActiveToast | null {
  return active;
}

export function hideToast(): void {
  if (!active) {
    return;
  }
  active = null;
  emit();
}

export const showToast = (
  type: ToastType,
  text1: string,
  visibilityTime = TOAST_VISIBILITY_MS,
): void => {
  active = {
    id: nextId++,
    type,
    text: text1,
    visibilityTime,
  };
  emit();
};
